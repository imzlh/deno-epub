Deno.chdir(import.meta.dirname!);
const files: Record<string, string> = {};
for (const file of Deno.readDirSync(".")) {
    if (file.name === import.meta.filename!) continue;
    files[file.name] = Deno.readTextFileSync(file.name).replaceAll(/\s+/g, ' ');
}

const out = '../assets.json';
Deno.writeTextFileSync(out, JSON.stringify(files));
console.log(`Wrote ${Object.keys(files).length} files to ${out}`);