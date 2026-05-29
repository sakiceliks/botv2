/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/mock-images/[name]/route";
exports.ids = ["app/api/mock-images/[name]/route"];
exports.modules = {

/***/ "(rsc)/./app/api/mock-images/[name]/route.ts":
/*!*********************************************!*\
  !*** ./app/api/mock-images/[name]/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:fs/promises */ \"node:fs/promises\");\n/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:path */ \"node:path\");\n/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n\n\nasync function GET(_request, { params }) {\n    const { name: filename } = await params;\n    if (filename.includes(\"..\") || filename.includes(\"/\")) {\n        return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n            error: \"Invalid filename\"\n        }, {\n            status: 400\n        });\n    }\n    const filePath = node_path__WEBPACK_IMPORTED_MODULE_1___default().join(process.cwd(), \"mock-image\", filename);\n    try {\n        const buffer = await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile)(filePath);\n        const ext = node_path__WEBPACK_IMPORTED_MODULE_1___default().extname(filename).toLowerCase();\n        const contentType = ext === \".png\" ? \"image/png\" : ext === \".gif\" ? \"image/gif\" : ext === \".webp\" ? \"image/webp\" : \"image/jpeg\";\n        return new next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse(buffer, {\n            headers: {\n                \"Content-Type\": contentType,\n                \"Cache-Control\": \"public, max-age=31536000, immutable\"\n            }\n        });\n    } catch  {\n        return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n            error: \"Image not found\"\n        }, {\n            status: 404\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL21vY2staW1hZ2VzL1tuYW1lXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBNEM7QUFDZjtBQUNjO0FBRXBDLGVBQWVHLElBQ3BCQyxRQUFpQixFQUNqQixFQUFFQyxNQUFNLEVBQXlDO0lBRWpELE1BQU0sRUFBRUMsTUFBTUMsUUFBUSxFQUFFLEdBQUcsTUFBTUY7SUFFakMsSUFBSUUsU0FBU0MsUUFBUSxDQUFDLFNBQVNELFNBQVNDLFFBQVEsQ0FBQyxNQUFNO1FBQ3JELE9BQU9OLHFEQUFZQSxDQUFDTyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFtQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUN4RTtJQUVBLE1BQU1DLFdBQVdYLHFEQUFTLENBQUNhLFFBQVFDLEdBQUcsSUFBSSxjQUFjUjtJQUV4RCxJQUFJO1FBQ0YsTUFBTVMsU0FBUyxNQUFNaEIsMERBQVFBLENBQUNZO1FBQzlCLE1BQU1LLE1BQU1oQix3REFBWSxDQUFDTSxVQUFVWSxXQUFXO1FBQzlDLE1BQU1DLGNBQ0pILFFBQVEsU0FBUyxjQUNqQkEsUUFBUSxTQUFTLGNBQ2pCQSxRQUFRLFVBQVUsZUFDbEI7UUFFRixPQUFPLElBQUlmLHFEQUFZQSxDQUFDYyxRQUFRO1lBQzlCSyxTQUFTO2dCQUNQLGdCQUFnQkQ7Z0JBQ2hCLGlCQUFpQjtZQUNuQjtRQUNGO0lBQ0YsRUFBRSxPQUFNO1FBQ04sT0FBT2xCLHFEQUFZQSxDQUFDTyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFrQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUN2RTtBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9hcHAvYXBpL21vY2staW1hZ2VzL1tuYW1lXS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gXCJub2RlOmZzL3Byb21pc2VzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChcbiAgX3JlcXVlc3Q6IFJlcXVlc3QsXG4gIHsgcGFyYW1zIH06IHsgcGFyYW1zOiBQcm9taXNlPHsgbmFtZTogc3RyaW5nIH0+IH1cbikge1xuICBjb25zdCB7IG5hbWU6IGZpbGVuYW1lIH0gPSBhd2FpdCBwYXJhbXM7XG5cbiAgaWYgKGZpbGVuYW1lLmluY2x1ZGVzKFwiLi5cIikgfHwgZmlsZW5hbWUuaW5jbHVkZXMoXCIvXCIpKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiSW52YWxpZCBmaWxlbmFtZVwiIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gIH1cblxuICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBcIm1vY2staW1hZ2VcIiwgZmlsZW5hbWUpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgcmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlbmFtZSkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBjb250ZW50VHlwZSA9XG4gICAgICBleHQgPT09IFwiLnBuZ1wiID8gXCJpbWFnZS9wbmdcIiA6XG4gICAgICBleHQgPT09IFwiLmdpZlwiID8gXCJpbWFnZS9naWZcIiA6XG4gICAgICBleHQgPT09IFwiLndlYnBcIiA/IFwiaW1hZ2Uvd2VicFwiIDpcbiAgICAgIFwiaW1hZ2UvanBlZ1wiO1xuXG4gICAgcmV0dXJuIG5ldyBOZXh0UmVzcG9uc2UoYnVmZmVyLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IGNvbnRlbnRUeXBlLFxuICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJwdWJsaWMsIG1heC1hZ2U9MzE1MzYwMDAsIGltbXV0YWJsZVwiXG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIkltYWdlIG5vdCBmb3VuZFwiIH0sIHsgc3RhdHVzOiA0MDQgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJyZWFkRmlsZSIsInBhdGgiLCJOZXh0UmVzcG9uc2UiLCJHRVQiLCJfcmVxdWVzdCIsInBhcmFtcyIsIm5hbWUiLCJmaWxlbmFtZSIsImluY2x1ZGVzIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwiZmlsZVBhdGgiLCJqb2luIiwicHJvY2VzcyIsImN3ZCIsImJ1ZmZlciIsImV4dCIsImV4dG5hbWUiLCJ0b0xvd2VyQ2FzZSIsImNvbnRlbnRUeXBlIiwiaGVhZGVycyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/mock-images/[name]/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&page=%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&page=%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_sakicelik_Downloads_Ars_iv_1_app_api_mock_images_name_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/mock-images/[name]/route.ts */ \"(rsc)/./app/api/mock-images/[name]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/mock-images/[name]/route\",\n        pathname: \"/api/mock-images/[name]\",\n        filename: \"route\",\n        bundlePath: \"app/api/mock-images/[name]/route\"\n    },\n    resolvedPagePath: \"/Users/sakicelik/Downloads/Arşiv (1)/app/api/mock-images/[name]/route.ts\",\n    nextConfigOutput,\n    userland: _Users_sakicelik_Downloads_Ars_iv_1_app_api_mock_images_name_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZtb2NrLWltYWdlcyUyRiU1Qm5hbWUlNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRm1vY2staW1hZ2VzJTJGJTVCbmFtZSU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRm1vY2staW1hZ2VzJTJGJTVCbmFtZSU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRnNha2ljZWxpayUyRkRvd25sb2FkcyUyRkFycyVDQyVBN2l2JTIwKDEpJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRnNha2ljZWxpayUyRkRvd25sb2FkcyUyRkFycyVDQyVBN2l2JTIwKDEpJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUN5QjtBQUN0RztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL3Nha2ljZWxpay9Eb3dubG9hZHMvQXJzzKdpdiAoMSkvYXBwL2FwaS9tb2NrLWltYWdlcy9bbmFtZV0vcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL21vY2staW1hZ2VzL1tuYW1lXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL21vY2staW1hZ2VzL1tuYW1lXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvbW9jay1pbWFnZXMvW25hbWVdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL3Nha2ljZWxpay9Eb3dubG9hZHMvQXJzzKdpdiAoMSkvYXBwL2FwaS9tb2NrLWltYWdlcy9bbmFtZV0vcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&page=%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:fs/promises":
/*!***********************************!*\
  !*** external "node:fs/promises" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs/promises");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&page=%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fmock-images%2F%5Bname%5D%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();