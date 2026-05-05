import { GlobalRegistrator } from "@happy-dom/global-registrator";

// @testing-library/dom が import される前に DOM グローバルを登録する必要がある。
// このファイルは bunfig.toml の preload 配列で setup.ts より先に指定すること。
GlobalRegistrator.register({ url: "http://localhost/", width: 1280, height: 720 });
