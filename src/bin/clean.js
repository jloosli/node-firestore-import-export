import("del").then((module) => {
  module.deleteSync(["dist"]);
});
