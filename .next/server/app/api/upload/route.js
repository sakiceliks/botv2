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
exports.id = "app/api/upload/route";
exports.ids = ["app/api/upload/route"];
exports.modules = {

/***/ "(rsc)/./app/api/upload/route.ts":
/*!*********************************!*\
  !*** ./app/api/upload/route.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_imgbb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/imgbb */ \"(rsc)/./lib/imgbb.ts\");\n/* harmony import */ var _lib_storage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/storage */ \"(rsc)/./lib/storage.ts\");\n\n\n\nasync function POST(request) {\n    try {\n        const formData = await request.formData();\n        const file = formData.get(\"image\");\n        if (!(file instanceof File)) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Görsel dosyası zorunlu.\"\n            }, {\n                status: 400\n            });\n        }\n        const savedImage = await (0,_lib_storage__WEBPACK_IMPORTED_MODULE_2__.saveFormFile)(file);\n        const { imageUrl } = await (0,_lib_imgbb__WEBPACK_IMPORTED_MODULE_1__.uploadToImgbb)(savedImage.fullPath);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: true,\n            imageUrl,\n            imagePath: savedImage.relativePath\n        });\n    } catch (error) {\n        const errorMsg = error instanceof Error ? error.message : \"Bilinmeyen hata\";\n        console.error(\"[API/UPLOAD] ❌ Yükleme hatası:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: false,\n            error: errorMsg\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3VwbG9hZC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQTJDO0FBQ0M7QUFDQztBQUV0QyxlQUFlRyxLQUFLQyxPQUFnQjtJQUN6QyxJQUFJO1FBQ0YsTUFBTUMsV0FBVyxNQUFNRCxRQUFRQyxRQUFRO1FBQ3ZDLE1BQU1DLE9BQU9ELFNBQVNFLEdBQUcsQ0FBQztRQUUxQixJQUFJLENBQUVELENBQUFBLGdCQUFnQkUsSUFBRyxHQUFJO1lBQzNCLE9BQU9SLHFEQUFZQSxDQUFDUyxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBMEIsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQy9FO1FBRUEsTUFBTUMsYUFBYSxNQUFNViwwREFBWUEsQ0FBQ0k7UUFDdEMsTUFBTSxFQUFFTyxRQUFRLEVBQUUsR0FBRyxNQUFNWix5REFBYUEsQ0FBQ1csV0FBV0UsUUFBUTtRQUU1RCxPQUFPZCxxREFBWUEsQ0FBQ1MsSUFBSSxDQUFDO1lBQ3ZCTSxJQUFJO1lBQ0pGO1lBQ0FHLFdBQVdKLFdBQVdLLFlBQVk7UUFDcEM7SUFDRixFQUFFLE9BQU9QLE9BQU87UUFDZCxNQUFNUSxXQUFXUixpQkFBaUJTLFFBQVFULE1BQU1VLE9BQU8sR0FBRztRQUMxREMsUUFBUVgsS0FBSyxDQUFDLGtDQUFrQ0E7UUFDaEQsT0FBT1YscURBQVlBLENBQUNTLElBQUksQ0FBQztZQUFFTSxJQUFJO1lBQU9MLE9BQU9RO1FBQVMsR0FBRztZQUFFUCxRQUFRO1FBQUk7SUFDekU7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL3Nha2ljZWxpay9Eb3dubG9hZHMvQXJzzKdpdiAoMSkvYXBwL2FwaS91cGxvYWQvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgeyB1cGxvYWRUb0ltZ2JiIH0gZnJvbSBcIkAvbGliL2ltZ2JiXCI7XG5pbXBvcnQgeyBzYXZlRm9ybUZpbGUgfSBmcm9tIFwiQC9saWIvc3RvcmFnZVwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZm9ybURhdGEgPSBhd2FpdCByZXF1ZXN0LmZvcm1EYXRhKCk7XG4gICAgY29uc3QgZmlsZSA9IGZvcm1EYXRhLmdldChcImltYWdlXCIpO1xuXG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIEZpbGUpKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJHw7Zyc2VsIGRvc3lhc8SxIHpvcnVubHUuXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlZEltYWdlID0gYXdhaXQgc2F2ZUZvcm1GaWxlKGZpbGUpO1xuICAgIGNvbnN0IHsgaW1hZ2VVcmwgfSA9IGF3YWl0IHVwbG9hZFRvSW1nYmIoc2F2ZWRJbWFnZS5mdWxsUGF0aCk7XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgb2s6IHRydWUsXG4gICAgICBpbWFnZVVybCxcbiAgICAgIGltYWdlUGF0aDogc2F2ZWRJbWFnZS5yZWxhdGl2ZVBhdGgsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiQmlsaW5tZXllbiBoYXRhXCI7XG4gICAgY29uc29sZS5lcnJvcihcIltBUEkvVVBMT0FEXSDinYwgWcO8a2xlbWUgaGF0YXPEsTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG9rOiBmYWxzZSwgZXJyb3I6IGVycm9yTXNnIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJ1cGxvYWRUb0ltZ2JiIiwic2F2ZUZvcm1GaWxlIiwiUE9TVCIsInJlcXVlc3QiLCJmb3JtRGF0YSIsImZpbGUiLCJnZXQiLCJGaWxlIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwic2F2ZWRJbWFnZSIsImltYWdlVXJsIiwiZnVsbFBhdGgiLCJvayIsImltYWdlUGF0aCIsInJlbGF0aXZlUGF0aCIsImVycm9yTXNnIiwiRXJyb3IiLCJtZXNzYWdlIiwiY29uc29sZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/upload/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/imgbb.ts":
/*!**********************!*\
  !*** ./lib/imgbb.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   uploadToImgbb: () => (/* binding */ uploadToImgbb)\n/* harmony export */ });\n/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:fs/promises */ \"node:fs/promises\");\n/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_0__);\n\nasync function uploadToImgbb(imagePath) {\n    const apiKey = process.env.IMGBB_API_KEY;\n    if (!apiKey) {\n        throw new Error(\"IMGBB_API_KEY tanimli degil.\");\n    }\n    const fileBuffer = await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile)(imagePath);\n    const formData = new FormData();\n    formData.append(\"key\", apiKey);\n    formData.append(\"image\", fileBuffer.toString(\"base64\"));\n    const response = await fetch(\"https://api.imgbb.com/1/upload\", {\n        method: \"POST\",\n        headers: {\n            \"Accept\": \"application/json\"\n        },\n        body: formData\n    });\n    if (!response.ok) {\n        throw new Error(`imgbb yukleme hatasi: ${response.status}`);\n    }\n    const json = await response.json();\n    const imageUrl = json.data?.display_url ?? json.data?.url;\n    if (!imageUrl) {\n        throw new Error(\"imgbb cevabinda public image URL bulunamadi.\");\n    }\n    return {\n        imageUrl,\n        deleteUrl: json.data?.delete_url ?? null\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvaW1nYmIudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTRDO0FBRXJDLGVBQWVDLGNBQWNDLFNBQWlCO0lBQ25ELE1BQU1DLFNBQVNDLFFBQVFDLEdBQUcsQ0FBQ0MsYUFBYTtJQUN4QyxJQUFJLENBQUNILFFBQVE7UUFDWCxNQUFNLElBQUlJLE1BQU07SUFDbEI7SUFFQSxNQUFNQyxhQUFhLE1BQU1SLDBEQUFRQSxDQUFDRTtJQUNsQyxNQUFNTyxXQUFXLElBQUlDO0lBQ3JCRCxTQUFTRSxNQUFNLENBQUMsT0FBT1I7SUFDdkJNLFNBQVNFLE1BQU0sQ0FBQyxTQUFTSCxXQUFXSSxRQUFRLENBQUM7SUFFN0MsTUFBTUMsV0FBVyxNQUFNQyxNQUFNLGtDQUFrQztRQUM3REMsUUFBUTtRQUNSQyxTQUFTO1lBQ1AsVUFBVTtRQUNaO1FBQ0FDLE1BQU1SO0lBQ1I7SUFFQSxJQUFJLENBQUNJLFNBQVNLLEVBQUUsRUFBRTtRQUNoQixNQUFNLElBQUlYLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRU0sU0FBU00sTUFBTSxFQUFFO0lBQzVEO0lBRUEsTUFBTUMsT0FBUSxNQUFNUCxTQUFTTyxJQUFJO0lBUWpDLE1BQU1DLFdBQVdELEtBQUtFLElBQUksRUFBRUMsZUFBZUgsS0FBS0UsSUFBSSxFQUFFRTtJQUN0RCxJQUFJLENBQUNILFVBQVU7UUFDYixNQUFNLElBQUlkLE1BQU07SUFDbEI7SUFFQSxPQUFPO1FBQ0xjO1FBQ0FJLFdBQVdMLEtBQUtFLElBQUksRUFBRUksY0FBYztJQUN0QztBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9saWIvaW1nYmIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tIFwibm9kZTpmcy9wcm9taXNlc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkVG9JbWdiYihpbWFnZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5JTUdCQl9BUElfS0VZO1xuICBpZiAoIWFwaUtleSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIklNR0JCX0FQSV9LRVkgdGFuaW1saSBkZWdpbC5cIik7XG4gIH1cblxuICBjb25zdCBmaWxlQnVmZmVyID0gYXdhaXQgcmVhZEZpbGUoaW1hZ2VQYXRoKTtcbiAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgZm9ybURhdGEuYXBwZW5kKFwia2V5XCIsIGFwaUtleSk7XG4gIGZvcm1EYXRhLmFwcGVuZChcImltYWdlXCIsIGZpbGVCdWZmZXIudG9TdHJpbmcoXCJiYXNlNjRcIikpO1xuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2FwaS5pbWdiYi5jb20vMS91cGxvYWRcIiwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJBY2NlcHRcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICB9LFxuICAgIGJvZHk6IGZvcm1EYXRhXG4gIH0pO1xuXG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGltZ2JiIHl1a2xlbWUgaGF0YXNpOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgfVxuXG4gIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpKSBhcyB7XG4gICAgZGF0YT86IHtcbiAgICAgIHVybD86IHN0cmluZztcbiAgICAgIGRpc3BsYXlfdXJsPzogc3RyaW5nO1xuICAgICAgZGVsZXRlX3VybD86IHN0cmluZztcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IGltYWdlVXJsID0ganNvbi5kYXRhPy5kaXNwbGF5X3VybCA/PyBqc29uLmRhdGE/LnVybDtcbiAgaWYgKCFpbWFnZVVybCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImltZ2JiIGNldmFiaW5kYSBwdWJsaWMgaW1hZ2UgVVJMIGJ1bHVuYW1hZGkuXCIpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpbWFnZVVybCxcbiAgICBkZWxldGVVcmw6IGpzb24uZGF0YT8uZGVsZXRlX3VybCA/PyBudWxsXG4gIH07XG59XG4iXSwibmFtZXMiOlsicmVhZEZpbGUiLCJ1cGxvYWRUb0ltZ2JiIiwiaW1hZ2VQYXRoIiwiYXBpS2V5IiwicHJvY2VzcyIsImVudiIsIklNR0JCX0FQSV9LRVkiLCJFcnJvciIsImZpbGVCdWZmZXIiLCJmb3JtRGF0YSIsIkZvcm1EYXRhIiwiYXBwZW5kIiwidG9TdHJpbmciLCJyZXNwb25zZSIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsImJvZHkiLCJvayIsInN0YXR1cyIsImpzb24iLCJpbWFnZVVybCIsImRhdGEiLCJkaXNwbGF5X3VybCIsInVybCIsImRlbGV0ZVVybCIsImRlbGV0ZV91cmwiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/imgbb.ts\n");

/***/ }),

/***/ "(rsc)/./lib/storage.ts":
/*!************************!*\
  !*** ./lib/storage.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ensureUploadDir: () => (/* binding */ ensureUploadDir),\n/* harmony export */   saveFormFile: () => (/* binding */ saveFormFile),\n/* harmony export */   saveFromPath: () => (/* binding */ saveFromPath)\n/* harmony export */ });\n/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:fs/promises */ \"node:fs/promises\");\n/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:path */ \"node:path\");\n/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst UPLOAD_DIR = node_path__WEBPACK_IMPORTED_MODULE_1___default().join(process.cwd(), \"uploads\");\nasync function ensureUploadDir() {\n    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.mkdir)(UPLOAD_DIR, {\n        recursive: true\n    });\n    return UPLOAD_DIR;\n}\nasync function saveFormFile(file) {\n    const uploadDir = await ensureUploadDir();\n    const bytes = await file.arrayBuffer();\n    const buffer = Buffer.from(bytes);\n    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, \"-\");\n    const fileName = `${Date.now()}_${safeName}`;\n    const fullPath = node_path__WEBPACK_IMPORTED_MODULE_1___default().join(uploadDir, fileName);\n    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.writeFile)(fullPath, buffer);\n    return {\n        fileName,\n        fullPath,\n        relativePath: `/uploads/${fileName}`\n    };\n}\nconst ALLOWED_IMAGE_EXTS = [\n    \".jpg\",\n    \".jpeg\",\n    \".png\",\n    \".webp\",\n    \".gif\"\n];\nasync function saveFromPath(filePath) {\n    const ext = node_path__WEBPACK_IMPORTED_MODULE_1___default().extname(filePath).toLowerCase();\n    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {\n        throw new Error(`Desteklenmeyen dosya uzantısı: ${ext}`);\n    }\n    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.access)(filePath);\n    const uploadDir = await ensureUploadDir();\n    const baseName = node_path__WEBPACK_IMPORTED_MODULE_1___default().basename(filePath).replace(/[^a-zA-Z0-9._-]/g, \"-\");\n    const fileName = `${Date.now()}_${baseName}`;\n    const fullPath = node_path__WEBPACK_IMPORTED_MODULE_1___default().join(uploadDir, fileName);\n    await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.copyFile)(filePath, fullPath);\n    return {\n        fileName,\n        fullPath,\n        relativePath: `/uploads/${fileName}`\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3RvcmFnZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQXNFO0FBQ3pDO0FBRTdCLE1BQU1LLGFBQWFELHFEQUFTLENBQUNHLFFBQVFDLEdBQUcsSUFBSTtBQUVyQyxlQUFlQztJQUNwQixNQUFNUCx1REFBS0EsQ0FBQ0csWUFBWTtRQUFFSyxXQUFXO0lBQUs7SUFDMUMsT0FBT0w7QUFDVDtBQUVPLGVBQWVNLGFBQWFDLElBQVU7SUFDM0MsTUFBTUMsWUFBWSxNQUFNSjtJQUN4QixNQUFNSyxRQUFRLE1BQU1GLEtBQUtHLFdBQVc7SUFDcEMsTUFBTUMsU0FBU0MsT0FBT0MsSUFBSSxDQUFDSjtJQUMzQixNQUFNSyxXQUFXUCxLQUFLUSxJQUFJLENBQUNDLE9BQU8sQ0FBQyxvQkFBb0I7SUFDdkQsTUFBTUMsV0FBVyxHQUFHQyxLQUFLQyxHQUFHLEdBQUcsQ0FBQyxFQUFFTCxVQUFVO0lBQzVDLE1BQU1NLFdBQVdyQixxREFBUyxDQUFDUyxXQUFXUztJQUN0QyxNQUFNbkIsMkRBQVNBLENBQUNzQixVQUFVVDtJQUMxQixPQUFPO1FBQ0xNO1FBQ0FHO1FBQ0FDLGNBQWMsQ0FBQyxTQUFTLEVBQUVKLFVBQVU7SUFDdEM7QUFDRjtBQUVBLE1BQU1LLHFCQUFxQjtJQUFDO0lBQVE7SUFBUztJQUFRO0lBQVM7Q0FBTztBQUU5RCxlQUFlQyxhQUFhQyxRQUFnQjtJQUNqRCxNQUFNQyxNQUFNMUIsd0RBQVksQ0FBQ3lCLFVBQVVHLFdBQVc7SUFDOUMsSUFBSSxDQUFDTCxtQkFBbUJNLFFBQVEsQ0FBQ0gsTUFBTTtRQUNyQyxNQUFNLElBQUlJLE1BQU0sQ0FBQywrQkFBK0IsRUFBRUosS0FBSztJQUN6RDtJQUVBLE1BQU05Qix3REFBTUEsQ0FBQzZCO0lBRWIsTUFBTWhCLFlBQVksTUFBTUo7SUFDeEIsTUFBTTBCLFdBQVcvQix5REFBYSxDQUFDeUIsVUFBVVIsT0FBTyxDQUFDLG9CQUFvQjtJQUNyRSxNQUFNQyxXQUFXLEdBQUdDLEtBQUtDLEdBQUcsR0FBRyxDQUFDLEVBQUVXLFVBQVU7SUFDNUMsTUFBTVYsV0FBV3JCLHFEQUFTLENBQUNTLFdBQVdTO0lBQ3RDLE1BQU1yQiwwREFBUUEsQ0FBQzRCLFVBQVVKO0lBRXpCLE9BQU87UUFDTEg7UUFDQUc7UUFDQUMsY0FBYyxDQUFDLFNBQVMsRUFBRUosVUFBVTtJQUN0QztBQUNGIiwic291cmNlcyI6WyIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9saWIvc3RvcmFnZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY2Nlc3MsIGNvcHlGaWxlLCBta2Rpciwgd3JpdGVGaWxlIH0gZnJvbSBcIm5vZGU6ZnMvcHJvbWlzZXNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcblxuY29uc3QgVVBMT0FEX0RJUiA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBcInVwbG9hZHNcIik7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVVcGxvYWREaXIoKSB7XG4gIGF3YWl0IG1rZGlyKFVQTE9BRF9ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICByZXR1cm4gVVBMT0FEX0RJUjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVGb3JtRmlsZShmaWxlOiBGaWxlKSB7XG4gIGNvbnN0IHVwbG9hZERpciA9IGF3YWl0IGVuc3VyZVVwbG9hZERpcigpO1xuICBjb25zdCBieXRlcyA9IGF3YWl0IGZpbGUuYXJyYXlCdWZmZXIoKTtcbiAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20oYnl0ZXMpO1xuICBjb25zdCBzYWZlTmFtZSA9IGZpbGUubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOS5fLV0vZywgXCItXCIpO1xuICBjb25zdCBmaWxlTmFtZSA9IGAke0RhdGUubm93KCl9XyR7c2FmZU5hbWV9YDtcbiAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odXBsb2FkRGlyLCBmaWxlTmFtZSk7XG4gIGF3YWl0IHdyaXRlRmlsZShmdWxsUGF0aCwgYnVmZmVyKTtcbiAgcmV0dXJuIHtcbiAgICBmaWxlTmFtZSxcbiAgICBmdWxsUGF0aCxcbiAgICByZWxhdGl2ZVBhdGg6IGAvdXBsb2Fkcy8ke2ZpbGVOYW1lfWBcbiAgfTtcbn1cblxuY29uc3QgQUxMT1dFRF9JTUFHRV9FWFRTID0gW1wiLmpwZ1wiLCBcIi5qcGVnXCIsIFwiLnBuZ1wiLCBcIi53ZWJwXCIsIFwiLmdpZlwiXTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVGcm9tUGF0aChmaWxlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCFBTExPV0VEX0lNQUdFX0VYVFMuaW5jbHVkZXMoZXh0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRGVzdGVrbGVubWV5ZW4gZG9zeWEgdXphbnTEsXPEsTogJHtleHR9YCk7XG4gIH1cblxuICBhd2FpdCBhY2Nlc3MoZmlsZVBhdGgpO1xuXG4gIGNvbnN0IHVwbG9hZERpciA9IGF3YWl0IGVuc3VyZVVwbG9hZERpcigpO1xuICBjb25zdCBiYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnJlcGxhY2UoL1teYS16QS1aMC05Ll8tXS9nLCBcIi1cIik7XG4gIGNvbnN0IGZpbGVOYW1lID0gYCR7RGF0ZS5ub3coKX1fJHtiYXNlTmFtZX1gO1xuICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbih1cGxvYWREaXIsIGZpbGVOYW1lKTtcbiAgYXdhaXQgY29weUZpbGUoZmlsZVBhdGgsIGZ1bGxQYXRoKTtcblxuICByZXR1cm4ge1xuICAgIGZpbGVOYW1lLFxuICAgIGZ1bGxQYXRoLFxuICAgIHJlbGF0aXZlUGF0aDogYC91cGxvYWRzLyR7ZmlsZU5hbWV9YCxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6WyJhY2Nlc3MiLCJjb3B5RmlsZSIsIm1rZGlyIiwid3JpdGVGaWxlIiwicGF0aCIsIlVQTE9BRF9ESVIiLCJqb2luIiwicHJvY2VzcyIsImN3ZCIsImVuc3VyZVVwbG9hZERpciIsInJlY3Vyc2l2ZSIsInNhdmVGb3JtRmlsZSIsImZpbGUiLCJ1cGxvYWREaXIiLCJieXRlcyIsImFycmF5QnVmZmVyIiwiYnVmZmVyIiwiQnVmZmVyIiwiZnJvbSIsInNhZmVOYW1lIiwibmFtZSIsInJlcGxhY2UiLCJmaWxlTmFtZSIsIkRhdGUiLCJub3ciLCJmdWxsUGF0aCIsInJlbGF0aXZlUGF0aCIsIkFMTE9XRURfSU1BR0VfRVhUUyIsInNhdmVGcm9tUGF0aCIsImZpbGVQYXRoIiwiZXh0IiwiZXh0bmFtZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJFcnJvciIsImJhc2VOYW1lIiwiYmFzZW5hbWUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/storage.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Froute&page=%2Fapi%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Froute&page=%2Fapi%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_sakicelik_Downloads_Ars_iv_1_app_api_upload_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/upload/route.ts */ \"(rsc)/./app/api/upload/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/upload/route\",\n        pathname: \"/api/upload\",\n        filename: \"route\",\n        bundlePath: \"app/api/upload/route\"\n    },\n    resolvedPagePath: \"/Users/sakicelik/Downloads/Arşiv (1)/app/api/upload/route.ts\",\n    nextConfigOutput,\n    userland: _Users_sakicelik_Downloads_Ars_iv_1_app_api_upload_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ1cGxvYWQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnVwbG9hZCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnVwbG9hZCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRnNha2ljZWxpayUyRkRvd25sb2FkcyUyRkFycyVDQyVBN2l2JTIwKDEpJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRnNha2ljZWxpayUyRkRvd25sb2FkcyUyRkFycyVDQyVBN2l2JTIwKDEpJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNhO0FBQzFGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9hcHAvYXBpL3VwbG9hZC9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvdXBsb2FkL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvdXBsb2FkXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS91cGxvYWQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9hcHAvYXBpL3VwbG9hZC9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Froute&page=%2Fapi%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Froute&page=%2Fapi%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();