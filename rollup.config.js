import ts from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import serve from "rollup-plugin-serve";
import path from "path";

export default {
  // 入口
  input: "src/index.ts",
  output: {
    name: "VueReactivity", //window.VueReactivity
    file: path.resolve("dist/vue.js"), // 输出的文件路径
    format: "es", // amd commonjs规范  默认将打包后的结果挂载到window上
    sourcemap: true, // 生成映射文件
  },
  // 插件
  plugins: [
    // 解析第三方模块
    nodeResolve({
      extensions: [".js", ".ts"],
    }),
    // 解析ts
    ts({
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
    }),
    // 替换环境变量
    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
    }),
    // 启动服务
    serve({
      open: true,
      openPage: "/public/index.html",
      port: 3000,
      contentBase: "",
    }),
  ],
};
