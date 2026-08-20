import ts from "typescript";
export type Chunk={text:string;path:string;startLine:number;endLine:number;kind:string};
export function chunkFile(path:string,source:string):Chunk[]{
 const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true); const out:Chunk[]=[];
 function add(node:ts.Node,kind:string){const a=sf.getLineAndCharacterOfPosition(node.getStart(sf)); const b=sf.getLineAndCharacterOfPosition(node.getEnd()); const text=node.getText(sf).trim(); if(text.length>20) out.push({text,path,startLine:a.line+1,endLine:b.line+1,kind});}
 function walk(node:ts.Node){if(ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node)||ts.isMethodDeclaration(node)||ts.isInterfaceDeclaration(node)||ts.isTypeAliasDeclaration(node)) add(node,ts.SyntaxKind[node.kind]); ts.forEachChild(node,walk)} walk(sf);
 if(!out.length){const lines=source.split(/\r?\n/); for(let i=0;i<lines.length;i+=80){const part=lines.slice(i,i+80).join("\n").trim();if(part)out.push({text:part,path,startLine:i+1,endLine:Math.min(i+80,lines.length),kind:"block"})}} return out;
}
