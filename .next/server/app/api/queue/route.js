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
exports.id = "app/api/queue/route";
exports.ids = ["app/api/queue/route"];
exports.modules = {

/***/ "(rsc)/./app/api/queue/route.ts":
/*!********************************!*\
  !*** ./app/api/queue/route.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE),\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_mongodb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/mongodb */ \"(rsc)/./lib/mongodb.ts\");\n/* harmony import */ var _models_QueueItem__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/models/QueueItem */ \"(rsc)/./models/QueueItem.ts\");\n\n\n\nasync function GET() {\n    try {\n        await (0,_lib_mongodb__WEBPACK_IMPORTED_MODULE_1__[\"default\"])();\n        const items = await _models_QueueItem__WEBPACK_IMPORTED_MODULE_2__[\"default\"].find({}).sort({\n            createdAt: -1\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: true,\n            items\n        });\n    } catch (error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: false,\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n}\nasync function POST(req) {\n    try {\n        await (0,_lib_mongodb__WEBPACK_IMPORTED_MODULE_1__[\"default\"])();\n        const { items } = await req.json();\n        // Upsert items (kuyruğu senkronize et)\n        // Bu basit versiyonda tüm kuyruğu gönderip eksikleri ekleyip güncelleyebiliriz.\n        for (const item of items){\n            await _models_QueueItem__WEBPACK_IMPORTED_MODULE_2__[\"default\"].findOneAndUpdate({\n                queueId: item.id\n            }, {\n                draft: item.draft,\n                preview: item.preview,\n                status: item.status,\n                errorMsg: item.errorMsg,\n                addedAt: item.addedAt,\n                duration: item.duration\n            }, {\n                upsert: true,\n                returnDocument: 'after'\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: true\n        });\n    } catch (error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: false,\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n}\nasync function DELETE(req) {\n    try {\n        await (0,_lib_mongodb__WEBPACK_IMPORTED_MODULE_1__[\"default\"])();\n        const { id, clearAll } = await req.json();\n        if (clearAll) {\n            await _models_QueueItem__WEBPACK_IMPORTED_MODULE_2__[\"default\"].deleteMany({});\n        } else {\n            await _models_QueueItem__WEBPACK_IMPORTED_MODULE_2__[\"default\"].deleteOne({\n                queueId: id\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: true\n        });\n    } catch (error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ok: false,\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3F1ZXVlL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUEyQztBQUNMO0FBQ0s7QUFFcEMsZUFBZUc7SUFDcEIsSUFBSTtRQUNGLE1BQU1GLHdEQUFTQTtRQUNmLE1BQU1HLFFBQVEsTUFBTUYseURBQVNBLENBQUNHLElBQUksQ0FBQyxDQUFDLEdBQUdDLElBQUksQ0FBQztZQUFFQyxXQUFXLENBQUM7UUFBRTtRQUM1RCxPQUFPUCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVDLElBQUk7WUFBTUw7UUFBTTtJQUM3QyxFQUFFLE9BQU9NLE9BQVk7UUFDbkIsT0FBT1YscURBQVlBLENBQUNRLElBQUksQ0FBQztZQUFFQyxJQUFJO1lBQU9DLE9BQU9BLE1BQU1DLE9BQU87UUFBQyxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM5RTtBQUNGO0FBRU8sZUFBZUMsS0FBS0MsR0FBWTtJQUNyQyxJQUFJO1FBQ0YsTUFBTWIsd0RBQVNBO1FBQ2YsTUFBTSxFQUFFRyxLQUFLLEVBQUUsR0FBRyxNQUFNVSxJQUFJTixJQUFJO1FBRWhDLHVDQUF1QztRQUN2QyxnRkFBZ0Y7UUFDaEYsS0FBSyxNQUFNTyxRQUFRWCxNQUFPO1lBQ3hCLE1BQU1GLHlEQUFTQSxDQUFDYyxnQkFBZ0IsQ0FDOUI7Z0JBQUVDLFNBQVNGLEtBQUtHLEVBQUU7WUFBQyxHQUNuQjtnQkFDRUMsT0FBT0osS0FBS0ksS0FBSztnQkFDakJDLFNBQVNMLEtBQUtLLE9BQU87Z0JBQ3JCUixRQUFRRyxLQUFLSCxNQUFNO2dCQUNuQlMsVUFBVU4sS0FBS00sUUFBUTtnQkFDdkJDLFNBQVNQLEtBQUtPLE9BQU87Z0JBQ3JCQyxVQUFVUixLQUFLUSxRQUFRO1lBQ3pCLEdBQ0E7Z0JBQUVDLFFBQVE7Z0JBQU1DLGdCQUFnQjtZQUFRO1FBRTVDO1FBRUEsT0FBT3pCLHFEQUFZQSxDQUFDUSxJQUFJLENBQUM7WUFBRUMsSUFBSTtRQUFLO0lBQ3RDLEVBQUUsT0FBT0MsT0FBWTtRQUNuQixPQUFPVixxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVDLElBQUk7WUFBT0MsT0FBT0EsTUFBTUMsT0FBTztRQUFDLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQzlFO0FBQ0Y7QUFFTyxlQUFlYyxPQUFPWixHQUFZO0lBQ3ZDLElBQUk7UUFDRixNQUFNYix3REFBU0E7UUFDZixNQUFNLEVBQUVpQixFQUFFLEVBQUVTLFFBQVEsRUFBRSxHQUFHLE1BQU1iLElBQUlOLElBQUk7UUFFdkMsSUFBSW1CLFVBQVU7WUFDWixNQUFNekIseURBQVNBLENBQUMwQixVQUFVLENBQUMsQ0FBQztRQUM5QixPQUFPO1lBQ0wsTUFBTTFCLHlEQUFTQSxDQUFDMkIsU0FBUyxDQUFDO2dCQUFFWixTQUFTQztZQUFHO1FBQzFDO1FBRUEsT0FBT2xCLHFEQUFZQSxDQUFDUSxJQUFJLENBQUM7WUFBRUMsSUFBSTtRQUFLO0lBQ3RDLEVBQUUsT0FBT0MsT0FBWTtRQUNuQixPQUFPVixxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVDLElBQUk7WUFBT0MsT0FBT0EsTUFBTUMsT0FBTztRQUFDLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQzlFO0FBQ0YiLCJzb3VyY2VzIjpbIi9Vc2Vycy9zYWtpY2VsaWsvRG93bmxvYWRzL0Fyc8ynaXYgKDEpL2FwcC9hcGkvcXVldWUvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgY29ubmVjdERCIGZyb20gXCJAL2xpYi9tb25nb2RiXCI7XG5pbXBvcnQgUXVldWVJdGVtIGZyb20gXCJAL21vZGVscy9RdWV1ZUl0ZW1cIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVCgpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjb25uZWN0REIoKTtcbiAgICBjb25zdCBpdGVtcyA9IGF3YWl0IFF1ZXVlSXRlbS5maW5kKHt9KS5zb3J0KHsgY3JlYXRlZEF0OiAtMSB9KTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBvazogdHJ1ZSwgaXRlbXMgfSk7XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBvazogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxOiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgY29ubmVjdERCKCk7XG4gICAgY29uc3QgeyBpdGVtcyB9ID0gYXdhaXQgcmVxLmpzb24oKTtcblxuICAgIC8vIFVwc2VydCBpdGVtcyAoa3V5cnXEn3Ugc2Vua3Jvbml6ZSBldClcbiAgICAvLyBCdSBiYXNpdCB2ZXJzaXlvbmRhIHTDvG0ga3V5cnXEn3UgZ8O2bmRlcmlwIGVrc2lrbGVyaSBla2xleWlwIGfDvG5jZWxsZXllYmlsaXJpei5cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgIGF3YWl0IFF1ZXVlSXRlbS5maW5kT25lQW5kVXBkYXRlKFxuICAgICAgICB7IHF1ZXVlSWQ6IGl0ZW0uaWQgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRyYWZ0OiBpdGVtLmRyYWZ0LFxuICAgICAgICAgIHByZXZpZXc6IGl0ZW0ucHJldmlldyxcbiAgICAgICAgICBzdGF0dXM6IGl0ZW0uc3RhdHVzLFxuICAgICAgICAgIGVycm9yTXNnOiBpdGVtLmVycm9yTXNnLFxuICAgICAgICAgIGFkZGVkQXQ6IGl0ZW0uYWRkZWRBdCxcbiAgICAgICAgICBkdXJhdGlvbjogaXRlbS5kdXJhdGlvbixcbiAgICAgICAgfSxcbiAgICAgICAgeyB1cHNlcnQ6IHRydWUsIHJldHVybkRvY3VtZW50OiAnYWZ0ZXInIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgb2s6IHRydWUgfSk7XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBvazogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIERFTEVURShyZXE6IFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjb25uZWN0REIoKTtcbiAgICBjb25zdCB7IGlkLCBjbGVhckFsbCB9ID0gYXdhaXQgcmVxLmpzb24oKTtcblxuICAgIGlmIChjbGVhckFsbCkge1xuICAgICAgYXdhaXQgUXVldWVJdGVtLmRlbGV0ZU1hbnkoe30pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBRdWV1ZUl0ZW0uZGVsZXRlT25lKHsgcXVldWVJZDogaWQgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgb2s6IHRydWUgfSk7XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBvazogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjb25uZWN0REIiLCJRdWV1ZUl0ZW0iLCJHRVQiLCJpdGVtcyIsImZpbmQiLCJzb3J0IiwiY3JlYXRlZEF0IiwianNvbiIsIm9rIiwiZXJyb3IiLCJtZXNzYWdlIiwic3RhdHVzIiwiUE9TVCIsInJlcSIsIml0ZW0iLCJmaW5kT25lQW5kVXBkYXRlIiwicXVldWVJZCIsImlkIiwiZHJhZnQiLCJwcmV2aWV3IiwiZXJyb3JNc2ciLCJhZGRlZEF0IiwiZHVyYXRpb24iLCJ1cHNlcnQiLCJyZXR1cm5Eb2N1bWVudCIsIkRFTEVURSIsImNsZWFyQWxsIiwiZGVsZXRlTWFueSIsImRlbGV0ZU9uZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/queue/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/mongodb.ts":
/*!************************!*\
  !*** ./lib/mongodb.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mongoose */ \"mongoose\");\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mongoose__WEBPACK_IMPORTED_MODULE_0__);\n\nconst MONGODB_URI = process.env.MONGODB_URI;\nif (!MONGODB_URI) {\n    throw new Error(\"Please define the MONGODB_URI environment variable inside .env\");\n}\nlet cached = global.mongoose;\nif (!cached) {\n    cached = global.mongoose = {\n        conn: null,\n        promise: null\n    };\n}\nasync function connectDB() {\n    if (cached.conn) {\n        return cached.conn;\n    }\n    if (!cached.promise) {\n        const opts = {\n            bufferCommands: false\n        };\n        cached.promise = mongoose__WEBPACK_IMPORTED_MODULE_0___default().connect(MONGODB_URI, opts).then((mongoose)=>{\n            return mongoose;\n        });\n    }\n    cached.conn = await cached.promise;\n    return cached.conn;\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (connectDB);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvbW9uZ29kYi50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBZ0M7QUFFaEMsTUFBTUMsY0FBY0MsUUFBUUMsR0FBRyxDQUFDRixXQUFXO0FBRTNDLElBQUksQ0FBQ0EsYUFBYTtJQUNoQixNQUFNLElBQUlHLE1BQU07QUFDbEI7QUFFQSxJQUFJQyxTQUFTLE9BQWdCTCxRQUFRO0FBRXJDLElBQUksQ0FBQ0ssUUFBUTtJQUNYQSxTQUFTLE9BQWdCTCxRQUFRLEdBQUc7UUFBRU8sTUFBTTtRQUFNQyxTQUFTO0lBQUs7QUFDbEU7QUFFQSxlQUFlQztJQUNiLElBQUlKLE9BQU9FLElBQUksRUFBRTtRQUNmLE9BQU9GLE9BQU9FLElBQUk7SUFDcEI7SUFFQSxJQUFJLENBQUNGLE9BQU9HLE9BQU8sRUFBRTtRQUNuQixNQUFNRSxPQUFPO1lBQ1hDLGdCQUFnQjtRQUNsQjtRQUVBTixPQUFPRyxPQUFPLEdBQUdSLHVEQUFnQixDQUFDQyxhQUFhUyxNQUFNRyxJQUFJLENBQUMsQ0FBQ2I7WUFDekQsT0FBT0E7UUFDVDtJQUNGO0lBQ0FLLE9BQU9FLElBQUksR0FBRyxNQUFNRixPQUFPRyxPQUFPO0lBQ2xDLE9BQU9ILE9BQU9FLElBQUk7QUFDcEI7QUFFQSxpRUFBZUUsU0FBU0EsRUFBQyIsInNvdXJjZXMiOlsiL1VzZXJzL3Nha2ljZWxpay9Eb3dubG9hZHMvQXJzzKdpdiAoMSkvbGliL21vbmdvZGIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vbmdvb3NlIGZyb20gXCJtb25nb29zZVwiO1xuXG5jb25zdCBNT05HT0RCX1VSSSA9IHByb2Nlc3MuZW52Lk1PTkdPREJfVVJJITtcblxuaWYgKCFNT05HT0RCX1VSSSkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgZGVmaW5lIHRoZSBNT05HT0RCX1VSSSBlbnZpcm9ubWVudCB2YXJpYWJsZSBpbnNpZGUgLmVudlwiKTtcbn1cblxubGV0IGNhY2hlZCA9IChnbG9iYWwgYXMgYW55KS5tb25nb29zZTtcblxuaWYgKCFjYWNoZWQpIHtcbiAgY2FjaGVkID0gKGdsb2JhbCBhcyBhbnkpLm1vbmdvb3NlID0geyBjb25uOiBudWxsLCBwcm9taXNlOiBudWxsIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbm5lY3REQigpIHtcbiAgaWYgKGNhY2hlZC5jb25uKSB7XG4gICAgcmV0dXJuIGNhY2hlZC5jb25uO1xuICB9XG5cbiAgaWYgKCFjYWNoZWQucHJvbWlzZSkge1xuICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICBidWZmZXJDb21tYW5kczogZmFsc2UsXG4gICAgfTtcblxuICAgIGNhY2hlZC5wcm9taXNlID0gbW9uZ29vc2UuY29ubmVjdChNT05HT0RCX1VSSSwgb3B0cykudGhlbigobW9uZ29vc2UpID0+IHtcbiAgICAgIHJldHVybiBtb25nb29zZTtcbiAgICB9KTtcbiAgfVxuICBjYWNoZWQuY29ubiA9IGF3YWl0IGNhY2hlZC5wcm9taXNlO1xuICByZXR1cm4gY2FjaGVkLmNvbm47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNvbm5lY3REQjtcbiJdLCJuYW1lcyI6WyJtb25nb29zZSIsIk1PTkdPREJfVVJJIiwicHJvY2VzcyIsImVudiIsIkVycm9yIiwiY2FjaGVkIiwiZ2xvYmFsIiwiY29ubiIsInByb21pc2UiLCJjb25uZWN0REIiLCJvcHRzIiwiYnVmZmVyQ29tbWFuZHMiLCJjb25uZWN0IiwidGhlbiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/mongodb.ts\n");

/***/ }),

/***/ "(rsc)/./models/QueueItem.ts":
/*!*****************************!*\
  !*** ./models/QueueItem.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mongoose */ \"mongoose\");\n/* harmony import */ var mongoose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mongoose__WEBPACK_IMPORTED_MODULE_0__);\n\nconst QueueItemSchema = new mongoose__WEBPACK_IMPORTED_MODULE_0__.Schema({\n    queueId: {\n        type: String,\n        required: true,\n        unique: true\n    },\n    draft: {\n        type: mongoose__WEBPACK_IMPORTED_MODULE_0__.Schema.Types.Mixed,\n        required: true\n    },\n    preview: {\n        type: String\n    },\n    status: {\n        type: String,\n        enum: [\n            \"pending\",\n            \"running\",\n            \"done\",\n            \"error\"\n        ],\n        default: \"pending\"\n    },\n    errorMsg: {\n        type: String\n    },\n    addedAt: {\n        type: String\n    },\n    duration: {\n        type: String\n    },\n    publishedAt: {\n        type: Date\n    },\n    logs: [\n        {\n            type: String\n        }\n    ]\n}, {\n    timestamps: true\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((mongoose__WEBPACK_IMPORTED_MODULE_0___default().models).QueueItem || mongoose__WEBPACK_IMPORTED_MODULE_0___default().model(\"QueueItem\", QueueItemSchema));\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9tb2RlbHMvUXVldWVJdGVtLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFzRDtBQWN0RCxNQUFNRSxrQkFBMEIsSUFBSUQsNENBQU1BLENBQUM7SUFDekNFLFNBQVM7UUFBRUMsTUFBTUM7UUFBUUMsVUFBVTtRQUFNQyxRQUFRO0lBQUs7SUFDdERDLE9BQU87UUFBRUosTUFBTUgsNENBQU1BLENBQUNRLEtBQUssQ0FBQ0MsS0FBSztRQUFFSixVQUFVO0lBQUs7SUFDbERLLFNBQVM7UUFBRVAsTUFBTUM7SUFBTztJQUN4Qk8sUUFBUTtRQUFFUixNQUFNQztRQUFRUSxNQUFNO1lBQUM7WUFBVztZQUFXO1lBQVE7U0FBUTtRQUFFQyxTQUFTO0lBQVU7SUFDMUZDLFVBQVU7UUFBRVgsTUFBTUM7SUFBTztJQUN6QlcsU0FBUztRQUFFWixNQUFNQztJQUFPO0lBQ3hCWSxVQUFVO1FBQUViLE1BQU1DO0lBQU87SUFDekJhLGFBQWE7UUFBRWQsTUFBTWU7SUFBSztJQUMxQkMsTUFBTTtRQUFDO1lBQUVoQixNQUFNQztRQUFPO0tBQUU7QUFDMUIsR0FBRztJQUFFZ0IsWUFBWTtBQUFLO0FBRXRCLGlFQUFlckIsd0RBQWUsQ0FBQ3VCLFNBQVMsSUFBSXZCLHFEQUFjLENBQWEsYUFBYUUsZ0JBQWdCQSxFQUFDIiwic291cmNlcyI6WyIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9tb2RlbHMvUXVldWVJdGVtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb25nb29zZSwgeyBTY2hlbWEsIERvY3VtZW50IH0gZnJvbSBcIm1vbmdvb3NlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVF1ZXVlSXRlbSBleHRlbmRzIERvY3VtZW50IHtcbiAgcXVldWVJZDogc3RyaW5nO1xuICBkcmFmdDogYW55O1xuICBwcmV2aWV3Pzogc3RyaW5nO1xuICBzdGF0dXM6IFwicGVuZGluZ1wiIHwgXCJydW5uaW5nXCIgfCBcImRvbmVcIiB8IFwiZXJyb3JcIjtcbiAgZXJyb3JNc2c/OiBzdHJpbmc7XG4gIGFkZGVkQXQ6IHN0cmluZztcbiAgZHVyYXRpb24/OiBzdHJpbmc7XG4gIHB1Ymxpc2hlZEF0PzogRGF0ZTtcbiAgbG9nczogc3RyaW5nW107XG59XG5cbmNvbnN0IFF1ZXVlSXRlbVNjaGVtYTogU2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gIHF1ZXVlSWQ6IHsgdHlwZTogU3RyaW5nLCByZXF1aXJlZDogdHJ1ZSwgdW5pcXVlOiB0cnVlIH0sXG4gIGRyYWZ0OiB7IHR5cGU6IFNjaGVtYS5UeXBlcy5NaXhlZCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgcHJldmlldzogeyB0eXBlOiBTdHJpbmcgfSxcbiAgc3RhdHVzOiB7IHR5cGU6IFN0cmluZywgZW51bTogW1wicGVuZGluZ1wiLCBcInJ1bm5pbmdcIiwgXCJkb25lXCIsIFwiZXJyb3JcIl0sIGRlZmF1bHQ6IFwicGVuZGluZ1wiIH0sXG4gIGVycm9yTXNnOiB7IHR5cGU6IFN0cmluZyB9LFxuICBhZGRlZEF0OiB7IHR5cGU6IFN0cmluZyB9LFxuICBkdXJhdGlvbjogeyB0eXBlOiBTdHJpbmcgfSxcbiAgcHVibGlzaGVkQXQ6IHsgdHlwZTogRGF0ZSB9LFxuICBsb2dzOiBbeyB0eXBlOiBTdHJpbmcgfV0sXG59LCB7IHRpbWVzdGFtcHM6IHRydWUgfSk7XG5cbmV4cG9ydCBkZWZhdWx0IG1vbmdvb3NlLm1vZGVscy5RdWV1ZUl0ZW0gfHwgbW9uZ29vc2UubW9kZWw8SVF1ZXVlSXRlbT4oXCJRdWV1ZUl0ZW1cIiwgUXVldWVJdGVtU2NoZW1hKTtcbiJdLCJuYW1lcyI6WyJtb25nb29zZSIsIlNjaGVtYSIsIlF1ZXVlSXRlbVNjaGVtYSIsInF1ZXVlSWQiLCJ0eXBlIiwiU3RyaW5nIiwicmVxdWlyZWQiLCJ1bmlxdWUiLCJkcmFmdCIsIlR5cGVzIiwiTWl4ZWQiLCJwcmV2aWV3Iiwic3RhdHVzIiwiZW51bSIsImRlZmF1bHQiLCJlcnJvck1zZyIsImFkZGVkQXQiLCJkdXJhdGlvbiIsInB1Ymxpc2hlZEF0IiwiRGF0ZSIsImxvZ3MiLCJ0aW1lc3RhbXBzIiwibW9kZWxzIiwiUXVldWVJdGVtIiwibW9kZWwiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./models/QueueItem.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fqueue%2Froute&page=%2Fapi%2Fqueue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fqueue%2Froute&page=%2Fapi%2Fqueue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_sakicelik_Downloads_Ars_iv_1_app_api_queue_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/queue/route.ts */ \"(rsc)/./app/api/queue/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/queue/route\",\n        pathname: \"/api/queue\",\n        filename: \"route\",\n        bundlePath: \"app/api/queue/route\"\n    },\n    resolvedPagePath: \"/Users/sakicelik/Downloads/Arşiv (1)/app/api/queue/route.ts\",\n    nextConfigOutput,\n    userland: _Users_sakicelik_Downloads_Ars_iv_1_app_api_queue_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZxdWV1ZSUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGcXVldWUlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZxdWV1ZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRnNha2ljZWxpayUyRkRvd25sb2FkcyUyRkFycyVDQyVBN2l2JTIwKDEpJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRnNha2ljZWxpayUyRkRvd25sb2FkcyUyRkFycyVDQyVBN2l2JTIwKDEpJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNZO0FBQ3pGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvc2FraWNlbGlrL0Rvd25sb2Fkcy9BcnPMp2l2ICgxKS9hcHAvYXBpL3F1ZXVlL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9xdWV1ZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3F1ZXVlXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9xdWV1ZS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9zYWtpY2VsaWsvRG93bmxvYWRzL0Fyc8ynaXYgKDEpL2FwcC9hcGkvcXVldWUvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fqueue%2Froute&page=%2Fapi%2Fqueue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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

/***/ "mongoose":
/*!***************************!*\
  !*** external "mongoose" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("mongoose");

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

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fqueue%2Froute&page=%2Fapi%2Fqueue%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fqueue%2Froute.ts&appDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fsakicelik%2FDownloads%2FArs%CC%A7iv%20(1)&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();