// ABOUTME: Service worker entry — imports and calls the Gleam background main function.
// ABOUTME: This is the esbuild entry point; the output bundle becomes background.mjs.
import { main } from "./build/dev/javascript/app_gleam/background/main.mjs";
main();
