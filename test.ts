const input = `
class ReferenceBase {
    +string:50 typeShortDescription
    +string:150 typeLongDescription
    +string:10 code
}
`;

// Pattern to capture the class name and the body
const classPattern = /class\s+(\w+)\s*{([^}]*)}/;

// Execute the pattern
const classMatch = classPattern.exec(input);

if (classMatch) {
  const className = classMatch[1];
  const classBody = classMatch[2];

  console.log(`Class Name: ${className}`);

  // Pattern to capture each attribute
  const attributePattern = /\+\w+:\d+\s+\w+/g;
  const attributes = classBody.match(attributePattern);

  if (attributes) {
    attributes.forEach((attribute) => {
      console.log(`Attribute: ${attribute.trim()}`);
    });
  }
}
