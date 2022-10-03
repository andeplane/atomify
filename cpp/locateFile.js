// this file overrides the wasm file path from scriptDirectory (./static/js) to the server's base URL
Module["locateFile"] = (path, scriptDirectory_unused) => {
  console.log("Locating the file. Path: ", path)
  return path;
};
