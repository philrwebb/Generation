import fs from 'fs';
import path from 'path';

export const writeControllerFile = (
  className: string,
  injectVar: string,
  projectName: string,
  namespace: string,
  controllerRoot: string,
) => {
  let controllerContent = `using Microsoft.AspNetCore.Mvc;
using #projectname#.Repositories;
using model.referencedata;

namespace #projectname#.Controllers.#namespace#;
[ApiController]
[Route("api/[controller]")]
public class #className#Controller : ControllerBase
{
    private readonly I#className#Repository _#injectVar#Repository;
    private readonly ILogger<#className#Controller> _logger;
    public #className#Controller(I#className#Repository #injectVar#Repository, ILogger<#className#Controller> logger)
    {
        this._#injectVar#Repository = #injectVar#Repository;
        this._logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll#className#s()
    {
        var #injectVar#s = await _#injectVar#Repository.GetAll();
        return Ok(#injectVar#s);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get#className#ById(int id)
    {
        var #injectVar# = await _#injectVar#Repository.GetById(id);
        return Ok(#injectVar#);
    }

    [HttpPost]
    public async Task<IActionResult> Add#className#([FromBody] #className# #injectVar#)
    {
        _logger.LogDebug("Adding #className# in controller");
        var new#className# = await _#injectVar#Repository.Add(#injectVar#);
        await _#injectVar#Repository.SaveChangesAsync();
        return Ok(new#className#);
    }

    [HttpPut]
    public async Task<IActionResult> Update#className#([FromBody] #className# #injectVar#)
    {
        var updated#className# = await _#injectVar#Repository.Update(#injectVar#);
        return Ok(updated#className#);
    }

}`;

  controllerContent = controllerContent.replace(/#projectname#/g, projectName);
  controllerContent = controllerContent.replace(/#className#/g, className);
  controllerContent = controllerContent.replace(/#injectVar#/g, injectVar);
  controllerContent = controllerContent.replace(/#namespace#/g, namespace);

  fs.writeFileSync(
    controllerRoot + '/' + className + 'Controller.cs',
    controllerContent,
  );
};

export const writeExtensions = (
  projectName: string,
  extensionsRoot: string,
) => {
  let extensionsContent = `using Serilog;
  using Serilog.Events;
  using Serilog.Sinks.SystemConsole.Themes;
  
  namespace #projectName#.Extensions;
  
  public static class SerilogExtensions
  {
      public static void ConfigureSerilog()
      {
          Log.Logger = new LoggerConfiguration()
              .MinimumLevel.Debug()
              .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
              .Enrich.FromLogContext()
              .WriteTo.Console(
                  outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}",
                  theme: new AnsiConsoleTheme(new Dictionary<ConsoleThemeStyle, string>
                  {
                      [ConsoleThemeStyle.Text] = "\x1b[37m", // White
                      [ConsoleThemeStyle.SecondaryText] = "\x1b[30m", // Black
                      [ConsoleThemeStyle.TertiaryText] = "\x1b[90m", // Dark gray
                      [ConsoleThemeStyle.Invalid] = "\x1b[31m", // Red
                      [ConsoleThemeStyle.Null] = "\x1b[35m", // Magenta
                      [ConsoleThemeStyle.Name] = "\x1b[36m", // Cyan
                      [ConsoleThemeStyle.String] = "\x1b[32m", // Green
                      [ConsoleThemeStyle.Number] = "\x1b[33m", // Yellow
                      [ConsoleThemeStyle.Boolean] = "\x1b[33m", // Yellow
                      [ConsoleThemeStyle.Scalar] = "\x1b[33m", // Yellow
                      [ConsoleThemeStyle.LevelVerbose] = "\x1b[37m", // White
                      [ConsoleThemeStyle.LevelDebug] = "\x1b[34m", // Blue
                      [ConsoleThemeStyle.LevelInformation] = "\x1b[32m", // Green
                      [ConsoleThemeStyle.LevelWarning] = "\x1b[33m", // Yellow
                      [ConsoleThemeStyle.LevelError] = "\x1b[31m", // Red
                      [ConsoleThemeStyle.LevelFatal] = "\x1b[31m\x1b[1m", // Bold red
                  }))
              .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
              .CreateLogger();
      }
  }`;

  extensionsContent = extensionsContent.replace('#projectName#', projectName);
  fs.writeFileSync(extensionsRoot + '/SerilogExtensions.cs', extensionsContent);

  extensionsContent = `using System.Reflection;
  using #projectName#.Repositories;
  using Microsoft.Extensions.DependencyInjection;
  using Serilog;
  
  namespace #projectName.Extensions;
  
  public static class ServiceCollectionExtensions
  {
      public static void AddRepositories(this IServiceCollection services, Assembly assembly)
      {
          var repositoryTypes = assembly.GetTypes()
              .Where(t => t.GetInterfaces().Contains(typeof(IRepository)) && t.IsClass);
  
          foreach (var implementationType in repositoryTypes)
          {
              var interfaceType = implementationType.GetInterfaces().First(i => i != typeof(IRepository));
              services.AddScoped(interfaceType, implementationType);
          }
      }
  }
  `;
  extensionsContent = extensionsContent.replace('#projectName#', projectName);
  fs.writeFileSync(
    extensionsRoot + '/ServiceCollectionExtensions.cs',
    extensionsContent,
  );
};

export const copyRecursiveSync = (src: string, dest: string) => {
  if (fs.existsSync(src)) {
    const stats = fs.statSync(src);
    const isDirectory = stats.isDirectory();

    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName),
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
};

export const writeProjectFile = (projectName: string, outputRoot: string) => {
  const projectFileContent = `
  <Project Sdk="Microsoft.NET.Sdk.Web">
  
    <PropertyGroup>
      <TargetFramework>net9.0</TargetFramework>
      <Nullable>enable</Nullable>
      <ImplicitUsings>enable</ImplicitUsings>
    </PropertyGroup>
  
    <ItemGroup>
      <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.0" />
      <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
      <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="9.0.0" />
      <PackageReference Include="Serilog" Version="4.1.0" />
      <PackageReference Include="Serilog.AspNetCore" Version="8.0.3" />
      <PackageReference Include="Serilog.Extensions.Hosting" Version="8.0.0" />
      <PackageReference Include="Serilog.Sinks.Console" Version="6.0.0" />
      <PackageReference Include="Serilog.Sinks.File" Version="6.0.0" />
    </ItemGroup>
  
  </Project>`;

  fs.writeFileSync(
    outputRoot + '/' + projectName + '.csproj',
    projectFileContent,
  );
};

export const writeProgramFile = (projectName: string, outputRoot: string) => {
  let programFileContent = `using #projectname#.Data;
  using Microsoft.EntityFrameworkCore;
  using System.Reflection;
  using #projectname#.Extensions;
  using Serilog;
  
  var builder = WebApplication.CreateBuilder(args);
  
  SerilogExtensions.ConfigureSerilog();
  builder.Host.UseSerilog();
  
  // Add services to the container.
  builder.Services.AddControllers();
  // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
  builder.Services.AddOpenApi();
  
  builder.Services.AddDbContext<AppDbContext>(options =>
  options.UseInMemoryDatabase("HumanResourcesDb"));
  
  // Register all repository services dynamically using the extension method
  builder.Services.AddRepositories(Assembly.GetExecutingAssembly());
  
  var app = builder.Build();
  
  // Configure the HTTP request pipeline.
  if (app.Environment.IsDevelopment())
  {
      app.MapOpenApi(
  
      );
  }
  
  app.UseHttpsRedirection();
  
  app.UseAuthorization();
  
  app.MapControllers();
  
  app.Run();
  `;
  programFileContent = programFileContent.replace(
    /#projectname#/g,
    projectName,
  );
  fs.writeFileSync(outputRoot + '/Program.cs', programFileContent);
};

export const writeRepositoryInfrastructureFile = (
  outputFolder: string,
  projectName: string,
) => {
  let IRepositoryInfrastructureContent = `using System;
  using System.Collections.Generic;
  using System.Linq;
  using System.Threading.Tasks;
  
  namespace #projectName#.Repositories
  {
      public interface IRepository
      {
  
      }
  }`;
  IRepositoryInfrastructureContent = IRepositoryInfrastructureContent.replace(
    /#projectName#/g,
    projectName,
  );
  fs.writeFileSync(
    outputFolder + '/IRepository.cs',
    IRepositoryInfrastructureContent,
  );

  IRepositoryInfrastructureContent = `using System;
  using System.Collections.Generic;
  using System.Linq;
  using System.Threading.Tasks;
  
  namespace #projectName#.Repositories;
      public interface IRepositoryBase<T> : IRepository
      {
          Task<IEnumerable<T>> GetAll();
          Task<T> GetById(int id);
          Task<T> Add(T entity);
          Task<T> Update(T entity);
          Task<bool> SaveChangesAsync();
  
      }`;
  IRepositoryInfrastructureContent = IRepositoryInfrastructureContent.replace(
    /#projectName#/g,
    projectName,
  );
  fs.writeFileSync(
    outputFolder + '/IRepositoryBase.cs',
    IRepositoryInfrastructureContent,
  );
};

export const writeIRepositoryFile = (
  projectName: string,
  className: string,
  namespace: string,
  outputFolder: string,
) => {
  let repositoryContent = `using model.referencedata;
  
  namespace #projectName#.Repositories;
  public interface I#className#Repository : IRepositoryBase<#className#>
  {
  }
  `;
  if (!fs.existsSync(outputFolder + '/' + namespace)) {
    fs.mkdirSync(outputFolder + '/' + namespace, { recursive: true });
  }
  repositoryContent = repositoryContent.replace(/#className#/g, className);
  repositoryContent = repositoryContent.replace(/#projectName#/g, projectName);

  fs.writeFileSync(
    outputFolder + '/' + namespace + '/I' + className + 'Repository.cs',
    repositoryContent,
  );
};

export const setUpFolders = (
  outputRoot: string,
  controllerRoot: string,
  modelRoot: string,
  repositoryRoot: string,
  extensionsRoot: string,
  dataRoot: string,
  genClassPath: string,
) => {
  if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
  }
  if (!fs.existsSync(controllerRoot)) {
    fs.mkdirSync(controllerRoot, { recursive: true });
  }
  if (!fs.existsSync(modelRoot)) {
    fs.mkdirSync(modelRoot, { recursive: true });
  }
  if (!fs.existsSync(repositoryRoot)) {
    fs.mkdirSync(repositoryRoot, { recursive: true });
  }
  if (!fs.existsSync(extensionsRoot)) {
    fs.mkdirSync(extensionsRoot, { recursive: true });
  }
  if (!fs.existsSync(dataRoot)) {
    fs.mkdirSync(dataRoot, { recursive: true });
  }
  //copy all files and folder in .genClassPath to modelRoot overwriting existing files
  copyRecursiveSync(genClassPath, modelRoot);
};

export const toLowerCamelCase = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
};