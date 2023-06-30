const {
  lstatSync,
  readdirSync,
  copyFileSync,
  writeFileSync,
  mkdirSync,
} = require("fs");
const { dirname } = require("path");

function write(file, data) {
  try {
    mkdirSync(dirname(file), { recursive: true });
  } catch {
    console.error(`failed to write ${file}`);
  }

  writeFileSync(file, data);
}

function copyFiles(source, target) {
  const files = readdirSync(source);
  for (const file of files) {
    const curSource = `${source}/${file}`;
    if (lstatSync(curSource).isDirectory()) {
      mkdirSync(`${target}/${file}`, { recursive: true });
      copyFiles(curSource, `${target}/${file}`);
    } else {
      copyFileSync(curSource, `${target}/${file}`);
    }
  }
}

const out_dir = ".vercel/output";
const project_dist = "dist/mystore";

// Create a static folder in the Vercel output folder for browser assets
mkdirSync(`${out_dir}/static`, { recursive: true });
// Copy all browser assets to the static Vercel folder
copyFiles(`${project_dist}/browser`, `${out_dir}/static`);

// Create a serverless function that will run the server runtime
const fn_dir = `${out_dir}/functions/ssr.func`;
// Write the config file for the server runtime
write(
  `${fn_dir}/.vc-config.json`,
  JSON.stringify({
    runtime: "nodejs18.x",
    handler: "index.js",
    launcherType: "Nodejs",
  })
);

// Copy the main Spartacus bundle file to the serverless function directory
copyFiles(`${project_dist}/server`, fn_dir);
// Create an index.js file that will run the serverless application
write(`${fn_dir}/index.js`, `module.exports = require("./main.js").app();`);

// Since the serverless application relies on static files, create a function directory for them
mkdirSync(`${fn_dir}/${project_dist}/browser`, { recursive: true });
// Copy all the browser assets to the serverless function directory
copyFiles(`${project_dist}/browser`, `${fn_dir}/${project_dist}/browser`);

// Write a config file for Vercel build output
write(
  `${out_dir}/config.json`,
  JSON.stringify({
    version: 1,
    routes: [{ src: "/.*", dest: "/ssr" }],
  })
);
