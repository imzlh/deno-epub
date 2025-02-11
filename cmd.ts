import { parseArgs } from "jsr:@std/cli/parse-args";
import encodeEpub from 'jsr:@izg/epub';
import { basename } from "jsr:@std/path";

const rep = /[\x00-\x1F\x7F-\x9F\u200B-\u200F\uFEFF\uFF00-\uFFFF]/g;

/**
 * TXT转换成EPUB
 * @param data 输入的文件内容
 * @param input 输入的文件名
 * @param output 输出位置
 */
export async function toEpub(data: string, input: string, output: string) {
    // 分卷
    const chaps: Array<{
        title: string;
        content: string;
    }> = [];

    const matches = Array.from(data.matchAll(/第\s*[一二三四五六七八九十百千万亿0-9]+\s*[章节]\s+(.+)[\r\n]+/g));
    for (let i = 1; i < matches.length; i++) {
        const content = data.substring(matches[i - 1].index, matches[i].index),
            title = matches[i - 1][1];

        chaps.push({
            title,
            content: encodeContent(content)
        });
    }

    // 生成 epub 文件
    const res = await encodeEpub({
        title: basename(input)
    }, chaps, {
        noFormatHTML: true
    });

    await Deno.writeFile(output, res);
    console.log(`Conversion to EPUB Done!`);
}

const encodeContent = (str: string) => {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/\s*[\r\n]+\s*/g, '<br />')
        .replace(rep, '');
}

if (import.meta.main) {
    const args = parseArgs(Deno.args, {
        string: ['output'],
        boolean: ['help'],
        alias: {
            o: 'output',
            h: 'help'
        }
    });

    if (args.help) {
        console.log(`Convert TXT to EPUB file
    
    Usage:
      deno run 2epub.ts [options] <input>
    
    Options:
        -o, --output <output>  Output file name (default: input.epub)
        -h, --help             Show help
    
    Example:
      deno run 2epub.ts input.txt -o output.epub`);
        Deno.exit(0);
    }

    const input = args._[0];
    const output = args.output || input + '.epub';
    if (typeof input !== 'string')
        throw new Error('Input file is required');

    console.log(`Converting ${input} to ${output}`);

    const data = Deno.readTextFileSync(input);
    await toEpub(data, input, output);
}