const fs = require('fs').promises;
const path = require('path');

function isValidId(id) {
  const regex = /^[A-Za-z0-9_-]+$/;
  return regex.test(id);
}

async function main() {
  const [,, configPathArg, outDirArg, templateFileArg] = process.argv;
  const configPath = configPathArg || path.join(__dirname, 'data', 'snippets.json');
  const outDir = outDirArg || path.join(__dirname, 'ai');
  let templateContent = null;

  if (templateFileArg) {
    try {
      templateContent = await fs.readFile(templateFileArg, 'utf8');
    } catch (err) {
      throw new Error(`Could not read template file: ${templateFileArg}`);
    }
  }

  let raw;
  try {
    raw = await fs.readFile(configPath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read config file: ${configPath}`);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }

  let items;
  if (Array.isArray(config)) {
    items = config;
  } else if (Array.isArray(config.snippets)) {
    items = config.snippets;
  } else {
    throw new Error('Config file does not contain an array or a "snippets" array');
  }

  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch (err) {
    throw new Error(`Could not create output directory: ${outDir}. ${err.message}`);
  }

  let created = 0;
  for (const item of items) {
    if (!item.id || typeof item.id !== 'string') {
      console.warn(`Skipping item with missing or invalid id: ${JSON.stringify(item)}`);
      continue;
    }
    if (!isValidId(item.id)) {
      console.warn(`Skipping item with invalid id '${item.id}'. Allowed characters: alphanumerics, hyphens, underscores.`);
      continue;
    }

    const filename = `${item.id}.ai`;
    const filePath = path.join(outDir, filename);
    try {
      await fs.access(filePath);
      continue;
    } catch {
      // File does not exist, proceed to create
    }

    let content;
    if (templateContent) {
      content = templateContent.replace(/\{\{id\}\}/g, item.id);
    } else {
      content = `# AI File for Snippet ${item.id}\n\n// Write your AI prompt or instructions here.\n`;
    }

    try {
      await fs.writeFile(filePath, content, 'utf8');
      created++;
      console.log(`Created: ${filename}`);
    } catch (err) {
      console.error(`Error writing file ${filename}: ${err.message}`);
    }
  }

  console.log(`Finished. Created ${created} missing AI file(s).`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });