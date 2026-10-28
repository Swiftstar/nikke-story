import {mkdir,copyFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await mkdir(resolve(root,'dist'),{recursive:true});
for(const name of ['index.html','styles.css','app.js'])await copyFile(resolve(root,name),resolve(root,'dist',name));
for(const name of ['data','assets'])await cp(resolve(root,name),resolve(root,'dist',name),{recursive:true});
await copyFile(resolve(root,'.nojekyll'),resolve(root,'dist','.nojekyll'));
console.log('Static site built: dist/');
