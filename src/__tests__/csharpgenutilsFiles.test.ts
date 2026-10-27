import fs from "fs";
import os from "os";
import path from "path";
import type { Association, Class } from "../genmodel";
import * as utils from "../codegeneration/csharp/api_generator/csharpgenutils";

describe("C# API generation utilities", () => {
    let root: string;
    const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
    beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), "csharpgenutils-test-")); });
    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(root, { recursive: true, force: true });
    });

    it("writes a controller with injected repositories and CRUD routes", () => {
        utils.writeControllerFile("Category", "category", "CatalogApi", "catalog", root, []);
        const content = read("CategoryController.cs");
        for (const fragment of [
            "using CatalogApi.Repositories;", "using model.catalog;",
            "namespace CatalogApi.Controllers.catalog;", "[ApiController]", '[Route("api/[controller]")]',
            "ICategoryRepository categoryRepository", "ILogger<CategoryController> logger",
            "GetAllCategories()", "_categoryRepository.GetAll()", "GetCategoryById(int id)",
            "_categoryRepository.GetById(id)", "AddCategory([FromBody] Category category)",
            "_categoryRepository.Add(category)", "UpdateCategory([FromBody] Category category)",
            "_categoryRepository.Update(category)", "await _categoryRepository.SaveChangesAsync();",
        ]) expect(content).toContain(fragment);
        expect(content).not.toMatch(/#[A-Za-z]+#/);
    });

    it("writes logging and repository registration extensions", () => {
        utils.writeExtensions("CatalogApi", root);
        const logging = read("SerilogExtensions.cs");
        expect(logging).toContain("namespace CatalogApi.Extensions;");
        expect(logging).toContain("public static void ConfigureSerilog()");
        expect(logging).toContain(".WriteTo.Console(");
        expect(logging).toContain('.WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)');
        const services = read("ServiceCollectionExtensions.cs");
        expect(services).toContain("using CatalogApi.Repositories;");
        expect(services).toContain("namespace CatalogApi.Extensions;");
        expect(services).toContain("AddRepositories(this IServiceCollection services, Assembly assembly)");
        expect(services).toContain("services.AddScoped(interfaceType, implementationType);");
        expect(logging + services).not.toMatch(/#[A-Za-z]+#/);
    });

    it("writes a web project with database and logging dependencies", () => {
        utils.writeProjectFile("CatalogApi", root);
        const content = read("CatalogApi.csproj");
        expect(content).toContain('<Project Sdk="Microsoft.NET.Sdk.Web">');
        expect(content).toContain("<TargetFramework>net9.0</TargetFramework>");
        expect(content).toContain('Include="Microsoft.EntityFrameworkCore.Sqlite"');
        expect(content).toContain('Include="Serilog.AspNetCore"');
        expect(content).toContain("</Project>");
    });

    it("writes the application entry point with data, repositories, and routing", () => {
        utils.writeProgramFile("CatalogApi", root);
        const content = read("Program.cs");
        for (const fragment of ["using CatalogApi.Data;", "SerilogExtensions.ConfigureSerilog();",
            "builder.Services.AddControllers();", "builder.Services.AddDbContext<AppDbContext>",
            "options.UseSqlite", "builder.Services.AddRepositories(Assembly.GetExecutingAssembly());",
            "app.MapControllers();", "app.Run();"])
            expect(content).toContain(fragment);
        expect(content).not.toMatch(/#[A-Za-z]+#/);
    });

    it("writes repository interfaces and creates namespace folders only when necessary", () => {
        utils.writeRepositoryInfrastructureFile(root, "CatalogApi");
        expect(read("IRepository.cs")).toContain("namespace CatalogApi.Repositories");
        expect(read("IRepository.cs")).toContain("public interface IRepository");
        const base = read("IRepositoryBase.cs");
        for (const signature of ["IRepositoryBase<T> : IRepository", "Task<IEnumerable<T>> GetAll();",
            "Task<T> GetById(int id);", "Task<T> Add(T entity);", "Task<T> Update(T entity);",
            "Task<bool> SaveChangesAsync();"]) expect(base).toContain(signature);
        // The second interface shares an existing namespace folder.
        for (const name of ["Category", "Product"]) {
            utils.writeIRepositoryFile("CatalogApi", name, "catalog", root);
            const content = read(`catalog/I${name}Repository.cs`);
            expect(content).toContain("using model.catalog;");
            expect(content).toContain("namespace CatalogApi.Repositories;");
            expect(content).toContain(`I${name}Repository : IRepositoryBase<${name}>`);
            expect(content).not.toMatch(/#[A-Za-z]+#/);
        }
    });

    it("writes repositories with and without eager loading, reusing namespace folders", () => {
        const entity: Class = { name: "Category", attributes: [], isAbstract: false };
        const link = (role: string): Association => ({
            source: { class: entity, multiplicity: "*", navigability: false },
            target: { class: entity, multiplicity: "1", navigability: true, role },
        });
        utils.writeRepositoryFile("Category", "category", "CatalogApi", root, "catalog", [], []);
        const plain = read("catalog/CategoryRepository.cs");
        expect(plain).toContain("_context.Categories.FirstOrDefaultAsync(x => x.id == id)");
        expect(plain).not.toContain("Include(");
        utils.writeRepositoryFile("Category", "category", "CatalogApi", root, "catalog",
            [link("status"), link("type")], [link("products")]);
        const content = read("catalog/CategoryRepository.cs");
        for (const fragment of ["using model.catalog;", "using CatalogApi.Data;",
            "namespace CatalogApi.Repositories;", "CategoryRepository : ICategoryRepository",
            "_context.Categories.ToListAsync()",
            "_context.Categories.Include(x => x.status).Include(x => x.type).Include(x => x.products).FirstOrDefaultAsync",
            "_context.Categories.Add(category);", "_context.Categories.Update(category);",
            "Task.FromResult(category)", "await _context.SaveChangesAsync() >= 0"])
            expect(content).toContain(fragment);
        expect(content).not.toMatch(/#[A-Za-z]+#/);
    });

    it("copies nested directories, empty folders and binary files, overwriting existing files", () => {
        const source = path.join(root, "source");
        const destination = path.join(root, "destination");
        fs.mkdirSync(path.join(source, "nested"), { recursive: true });
        fs.mkdirSync(path.join(source, "empty"));
        const bytes = Buffer.from([0, 255, 128, 42]);
        fs.writeFileSync(path.join(source, "nested", "file.bin"), bytes);
        utils.copyRecursiveSync(source, destination);
        expect(fs.readFileSync(path.join(destination, "nested", "file.bin"))).toEqual(bytes);
        expect(fs.readdirSync(path.join(destination, "empty"))).toEqual([]);
        fs.writeFileSync(path.join(source, "nested", "file.bin"), "replacement");
        fs.writeFileSync(path.join(destination, "keep.txt"), "keep");
        utils.copyRecursiveSync(source, destination);
        expect(read("destination/nested/file.bin")).toBe("replacement");
        expect(read("destination/keep.txt")).toBe("keep");
        utils.copyRecursiveSync(path.join(root, "missing"), path.join(root, "unused"));
        expect(fs.existsSync(path.join(root, "unused"))).toBe(false);
    });

    it("creates output folders and refreshes generated models on subsequent runs", () => {
        const source = path.join(root, "models");
        fs.mkdirSync(source);
        fs.writeFileSync(path.join(source, "Category.cs"), "first");
        const output = path.join(root, "output");
        const folders = [output, ...["controllers", "model", "repositories", "extensions", "data"]
            .map((folder) => path.join(output, folder))];
        const launch = path.join(output, "Properties");
        const setup = () => utils.setUpFolders(folders[0], folders[1], folders[2], folders[3],
            folders[4], folders[5], source, launch);
        setup();
        for (const folder of [...folders, launch]) expect(fs.statSync(folder).isDirectory()).toBe(true);
        expect(read("output/model/Category.cs")).toBe("first");
        fs.writeFileSync(path.join(source, "Category.cs"), "updated");
        setup();
        expect(read("output/model/Category.cs")).toBe("updated");
    });

    it.each([".HasValue<Category>(\"Category\")\n", ".HasValue<Category>(\"Category\");"])(
        "writes DbContext sections for configuration %j", (configuration) => {
            utils.writeDbContextFile("CatalogApi", new Set(["using model.catalog;", "using model.reference;"]),
                "public DbSet<Category> Categories { get; set; }\n", configuration, root);
            const content = read("AppDbContext.cs");
            expect(content).toContain("namespace CatalogApi.Data;");
            expect(content).toContain("using model.catalog;\nusing model.reference;");
            expect(content).toContain("public DbSet<Category> Categories { get; set; }");
            expect(content).toContain('.HasValue<Category>("Category");');
            expect(content).not.toMatch(/#[A-Za-z]+#/);
        },
    );

    it("copies the launch settings template and logs success", () => {
        const log = jest.spyOn(console, "log").mockImplementation(() => {});
        utils.copyLaunchSettings(root);
        const template = path.resolve(__dirname, "../codegeneration/csharp/api_generator/templates/launchSettings.json");
        expect(read("launchSettings.json")).toBe(fs.readFileSync(template, "utf8"));
        expect(log).toHaveBeenCalledWith(`Copied launchSettings.json to ${path.join(root, "launchSettings.json")}`);
    });

    it("warns when no launch settings folder is configured", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const copy = jest.spyOn(fs, "copyFileSync");
        utils.copyLaunchSettings("");
        expect(warn).toHaveBeenCalledWith("config.launchSettingsFolder is not defined. Skipping launchSettings.json copy.");
        expect(copy).not.toHaveBeenCalled();
    });

    it("logs a missing launch settings template", () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(fs, "existsSync").mockReturnValue(false);
        const copy = jest.spyOn(fs, "copyFileSync");
        utils.copyLaunchSettings(root);
        expect(error).toHaveBeenCalledWith(expect.stringMatching(/Template file not found: .*templates[/\\]launchSettings.json$/));
        expect(copy).not.toHaveBeenCalled();
    });

    it("logs a launch settings copy failure without throwing", () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => {});
        const failure = new Error("Permission denied");
        jest.spyOn(fs, "copyFileSync").mockImplementation(() => { throw failure; });
        expect(() => utils.copyLaunchSettings(root)).not.toThrow();
        expect(error).toHaveBeenCalledWith("Error copying launchSettings.json:", failure);
    });
});

describe("C# naming utilities", () => {
    it.each([["", ""], ["Category", "category"], ["category", "category"], ["URL", "uRL"]])(
        "lowercases only the initial character in %j", (input, expected) => {
            expect(utils.toLowerCamelCase(input)).toBe(expected);
        },
    );

    it.each([
        ["MAN", "men"], ["woman", "women"], ["child", "children"], ["tooth", "teeth"],
        ["foot", "feet"], ["mouse", "mice"], ["goose", "geese"], ["Party", "Parties"],
        ["box", "boxes"], ["church", "churches"], ["city", "cities"],
        ["leaf", "leaves"], ["knife", "knives"], ["day", "days"],
    ])("pluralizes %s as %s", (input, expected) => {
        expect(utils.pluralize(input)).toBe(expected);
    });
});
