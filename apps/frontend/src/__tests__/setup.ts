import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";

// 各テスト後に React ツリーを自動的にアンマウントしてメモリリークを防ぐ
afterEach(cleanup);
