import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/emitron.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/emitron.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/emitron.umd.js',
      format: 'umd',
      name: 'emitron',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs()
  ],
};
