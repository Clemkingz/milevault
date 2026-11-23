/* MileVault clickable prototype. ROLE is injected at build time: 'client' or 'contributor'. */
const ICONS = {"home": "<path fill=\"currentColor\" d=\"M13.2 2.65a2 2 0 0 0-2.4 0l-7 5.25A2 2 0 0 0 3 9.5V19a2 2 0 0 0 2 2h3.9a1.1 1.1 0 0 0 1.1-1.1V15a2 2 0 1 1 4 0v4.9a1.1 1.1 0 0 0 1.1 1.1H19a2 2 0 0 0 2-2V9.5a2 2 0 0 0-.8-1.6z\"/>", "file": "<path fill=\"currentColor\" d=\"M12 2v6.5a1.5 1.5 0 0 0 1.356 1.493L13.5 10H20v10a2 2 0 0 1-1.85 1.995L18 22H6a2 2 0 0 1-1.995-1.85L4 20V4a2 2 0 0 1 1.85-1.995L6 2zm2 .043a2 2 0 0 1 .877.43l.123.113L19.414 7a2 2 0 0 1 .502.84l.04.16H14z\"/>", "transfer": "<path fill=\"currentColor\" d=\"M20 14a1.5 1.5 0 0 1 .144 2.993L20 17H7.621l1.44 1.44a1.5 1.5 0 0 1-2.008 2.224l-.114-.103-3.829-3.83c-.974-.974-.34-2.617.991-2.725l.14-.006H20ZM14.94 3.44a1.5 1.5 0 0 1 2.007-.104l.114.103 3.829 3.83c.974.974.34 2.617-.991 2.725l-.14.006H4a1.5 1.5 0 0 1-.144-2.993L4 7h12.379l-1.44-1.44a1.5 1.5 0 0 1 0-2.12Z\"/>", "wallet": "<path fill=\"currentColor\" d=\"M19 4a2 2 0 0 1 2 2v1h-6a5 5 0 0 0 0 10h6v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1 5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-5a3 3 0 1 1 0-6zm-5 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2\"/>", "down": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M13.06 16.06a1.5 1.5 0 0 1-2.12 0l-5.658-5.656a1.5 1.5 0 1 1 2.122-2.121L12 12.879l4.596-4.596a1.5 1.5 0 0 1 2.122 2.12l-5.657 5.658Z\"/>", "down_line": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M12.707 15.707a1 1 0 0 1-1.414 0L5.636 10.05A1 1 0 1 1 7.05 8.636l4.95 4.95 4.95-4.95a1 1 0 0 1 1.414 1.414l-5.657 5.657Z\"/>", "close": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"m12 14.122 5.303 5.303a1.5 1.5 0 0 0 2.122-2.122L14.12 12l5.304-5.303a1.5 1.5 0 1 0-2.122-2.121L12 9.879 6.697 4.576a1.5 1.5 0 1 0-2.122 2.12L9.88 12l-5.304 5.304a1.5 1.5 0 1 0 2.122 2.12z\"/>", "lock": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M6 8a6 6 0 1 1 12 0h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zm6-4a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4m2 10a2 2 0 0 1-1 1.732V17a1 1 0 1 1-2 0v-1.268A2 2 0 0 1 12 12a2 2 0 0 1 2 2\"/>", "arrow_up_right": "<path fill=\"currentColor\" d=\"M18 4.5A1.5 1.5 0 0 1 19.5 6v8a1.5 1.5 0 0 1-3 0V9.621l-9.097 9.097a1.5 1.5 0 0 1-2.12-2.122L14.377 7.5H10a1.5 1.5 0 1 1 0-3h8Z\"/>", "eye_close": "<path fill=\"currentColor\" d=\"M3.05 9.31a1 1 0 1 1 1.914-.577c2.086 6.986 11.982 6.987 14.07.004a1 1 0 1 1 1.918.57 9.509 9.509 0 0 1-1.813 3.417L20.414 14A1 1 0 0 1 19 15.414l-1.311-1.311a9.116 9.116 0 0 1-2.32 1.269l.357 1.335a1 1 0 1 1-1.931.518l-.364-1.357c-.947.14-1.915.14-2.862 0l-.364 1.357a1 1 0 1 1-1.931-.518l.357-1.335a9.118 9.118 0 0 1-2.32-1.27l-1.31 1.312A1 1 0 0 1 3.585 14l1.275-1.275c-.784-.936-1.41-2.074-1.812-3.414Z\"/>", "eye": "<path fill=\"currentColor\" d=\"M12 4c2.787 0 5.263 1.257 7.026 2.813.885.781 1.614 1.658 2.128 2.531.505.857.846 1.786.846 2.656 0 .87-.34 1.799-.846 2.656-.514.873-1.243 1.75-2.128 2.531C17.263 18.743 14.786 20 12 20c-2.787 0-5.263-1.257-7.026-2.813-.885-.781-1.614-1.658-2.128-2.531C2.34 13.799 2 12.87 2 12c0-.87.34-1.799.846-2.656.514-.873 1.243-1.75 2.128-2.531C6.737 5.257 9.214 4 12 4m0 2c-2.184 0-4.208.993-5.702 2.312-.744.656-1.332 1.373-1.729 2.047C4.163 11.049 4 11.62 4 12c0 .38.163.951.569 1.641.397.674.985 1.39 1.729 2.047C7.792 17.007 9.816 18 12 18s4.208-.993 5.702-2.312c.744-.657 1.332-1.373 1.729-2.047.406-.69.569-1.261.569-1.641 0-.38-.163-.951-.569-1.641-.397-.674-.985-1.39-1.729-2.047C16.208 6.993 14.184 6 12 6m0 3c.088 0 .175.004.261.011a2 2 0 0 0 2.728 2.728A3 3 0 1 1 12 9\"/>", "more": "<path fill=\"currentColor\" d=\"M12 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4m0-7a2 2 0 1 1 0 4 2 2 0 0 1 0-4m0-7a2 2 0 1 1 0 4 2 2 0 0 1 0-4\"/>", "info": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m-.01 8H11a1 1 0 0 0-.117 1.993L11 12v4.99c0 .52.394.95.9 1.004l.11.006h.49a1 1 0 0 0 .596-1.803L13 16.134V11.01c0-.52-.394-.95-.9-1.004zM12 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2\"/>", "folder_open": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M5 3a2 2 0 0 0-2 2v4.129a1.501 1.501 0 0 0-.861 1.665l1.72 8.598A2 2 0 0 0 5.819 21H18.18a2 2 0 0 0 1.961-1.608l1.72-8.598A1.501 1.501 0 0 0 21 9.13V7.5a2 2 0 0 0-2-2h-6.52l-1.399-1.75A2 2 0 0 0 9.52 3zm14 6V7.5h-6.52a2 2 0 0 1-1.561-.75L9.519 5H5v4z\"/>", "flag": "<path fill=\"currentColor\" d=\"M6 3a2 2 0 0 0-2 2v16a1 1 0 1 0 2 0v-5h13.804a1.1 1.1 0 0 0 .89-1.747L17.236 9.5l3.456-4.753A1.1 1.1 0 0 0 19.803 3z\"/>", "check_circle": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m3.535 6.381-4.95 4.95-2.12-2.121a1 1 0 0 0-1.415 1.414l2.758 2.758a1.1 1.1 0 0 0 1.556 0l5.586-5.586a1 1 0 0 0-1.415-1.415\"/>", "time": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 4a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1\"/>", "bill": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M17 2a3 3 0 0 1 3 3v16a1 1 0 0 1-1.625.78l-1.875-1.5-1.875 1.5a1 1 0 0 1-1.332-.073L12 20.414l-1.293 1.293a1 1 0 0 1-1.332.074L7.5 20.28l-1.875 1.5A1 1 0 0 1 4 21V5a3 3 0 0 1 3-3zm-5 10H9a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2m3-4H9a1 1 0 0 0-.117 1.993L9 10h6a1 1 0 0 0 .117-1.993z\"/>", "external": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M21 4a1 1 0 0 0-1-1h-5a1 1 0 1 0 0 2h2.586l-2.11 2.11a6.007 6.007 0 0 1 1.415 1.413L19 6.414V9a1 1 0 1 0 2 0zm-5.523 3.11A5.973 5.973 0 0 0 12 6H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7c0-1.296-.41-2.496-1.11-3.477l-6.183 6.184a1 1 0 0 1-1.414-1.414z\"/>", "safe_lock": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M11.298 2.195a2 2 0 0 1 1.404 0l7 2.625A2 2 0 0 1 21 6.693v5.363a9 9 0 0 1-4.975 8.05l-3.354 1.676a1.5 1.5 0 0 1-1.342 0l-3.354-1.677A9 9 0 0 1 3 12.055V6.694A2 2 0 0 1 4.298 4.82zM13 11.732A2 2 0 0 0 12 8a2 2 0 0 0-1 3.732V15a1 1 0 1 0 2 0z\"/>", "loading": "<defs><linearGradient id=\"gloadinga\" x1=\"50%\" x2=\"50%\" y1=\"5.271%\" y2=\"91.793%\"><stop offset=\"0%\" stop-color=\"currentColor\"/><stop offset=\"100%\" stop-color=\"currentColor\" stop-opacity=\".55\"/></linearGradient><linearGradient id=\"gloadingb\" x1=\"50%\" x2=\"50%\" y1=\"15.24%\" y2=\"87.15%\"><stop offset=\"0%\" stop-color=\"currentColor\" stop-opacity=\"0\"/><stop offset=\"100%\" stop-color=\"currentColor\" stop-opacity=\".55\"/></linearGradient></defs><path fill=\"url(#gloadinga)\" d=\"M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.502 7.502 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021\" transform=\"translate(1.5 1.625)\"/><path fill=\"url(#gloadingb)\" d=\"M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.475 10.475 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084 1.5 1.5 0 0 1-.115-2.118\" transform=\"translate(1.5 1.625)\"/>", "add": "<path fill=\"currentColor\" d=\"M10.5 20a1.5 1.5 0 0 0 3 0v-6.5H20a1.5 1.5 0 0 0 0-3h-6.5V4a1.5 1.5 0 0 0-3 0v6.5H4a1.5 1.5 0 0 0 0 3h6.5z\"/>", "search": "<path fill=\"currentColor\" d=\"M10.5 2a8.5 8.5 0 0 1 6.676 13.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 2a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13m0 1a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11\"/>", "left": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M7.94 13.06a1.5 1.5 0 0 1 0-2.12l5.656-5.658a1.5 1.5 0 1 1 2.121 2.122L11.122 12l4.596 4.596a1.5 1.5 0 1 1-2.12 2.122L7.938 13.06Z\"/>", "right": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M16.06 10.94a1.5 1.5 0 0 1 0 2.12l-5.656 5.658a1.5 1.5 0 1 1-2.121-2.122L12.879 12 8.283 7.404a1.5 1.5 0 0 1 2.12-2.122l5.658 5.657Z\"/>", "copy": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M9 2a2 2 0 0 0-2 2v2h2V4h11v11h-2v2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z\"/>", "file_new": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M12 2v6.5a1.5 1.5 0 0 0 1.356 1.493L13.5 10H20v10a2 2 0 0 1-1.85 1.995L18 22H6a2 2 0 0 1-1.995-1.85L4 20V4a2 2 0 0 1 1.85-1.995L6 2zm0 9.5a1 1 0 0 0-.993.883L11 12.5V14H9.5a1 1 0 0 0-.117 1.993L9.5 16H11v1.5a1 1 0 0 0 1.993.117L13 17.5V16h1.5a1 1 0 0 0 .117-1.993L14.5 14H13v-1.5a1 1 0 0 0-1-1m2-9.457a2 2 0 0 1 .877.43l.123.113L19.414 7a2 2 0 0 1 .502.84l.04.16H14z\"/>", "check": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M21.546 5.111a1.5 1.5 0 0 1 0 2.121L10.303 18.475a1.6 1.6 0 0 1-2.263 0L2.454 12.89a1.5 1.5 0 1 1 2.121-2.121l4.596 4.596L19.424 5.111a1.5 1.5 0 0 1 2.122 0\"/>", "menu": "<path fill=\"currentColor\" d=\"M20 17.5a1.5 1.5 0 0 1 .144 2.993L20 20.5H4a1.5 1.5 0 0 1-.144-2.993L4 17.5zm0-7a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3zm0-7a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 1 1 0-3z\"/>", "delete": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M14.28 2a2 2 0 0 1 1.897 1.368L16.72 5H20a1 1 0 1 1 0 2l-.003.071-.867 12.143A3 3 0 0 1 16.138 22H7.862a3 3 0 0 1-2.992-2.786L4.003 7.07A1.01 1.01 0 0 1 4 7a1 1 0 0 1 0-2h3.28l.543-1.632A2 2 0 0 1 9.721 2zM9 10a1 1 0 0 0-.993.883L8 11v6a1 1 0 0 0 1.993.117L10 17v-6a1 1 0 0 0-1-1m6 0a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1m-.72-6H9.72l-.333 1h5.226z\"/>", "coin": "<path fill=\"currentColor\" d=\"M12 5c2.592 0 4.986.465 6.77 1.258.89.396 1.674.893 2.247 1.496.53.557.914 1.243.975 2.029L22 10v4c0 .878-.404 1.639-.983 2.246-.573.603-1.356 1.1-2.247 1.496C16.986 18.535 14.592 19 12 19c-2.592 0-4.986-.465-6.77-1.258-.89-.396-1.674-.893-2.247-1.496-.53-.557-.914-1.243-.975-2.029L2 14v-4c0-.878.404-1.639.983-2.246.573-.603 1.356-1.1 2.247-1.496C7.014 5.465 9.408 5 12 5m8 8.08c-.375.246-.79.466-1.23.662C16.986 14.535 14.592 15 12 15c-2.592 0-4.986-.465-6.77-1.258A8.689 8.689 0 0 1 4 13.08V14c0 .227.1.518.432.868.337.354.872.719 1.61 1.047C7.516 16.57 9.622 17 12 17c2.379 0 4.484-.43 5.958-1.085.738-.328 1.273-.693 1.61-1.047.333-.35.432-.641.432-.868z\"/>", "refresh": "<path fill=\"currentColor\" d=\"M1.498 12.082c-.01-1.267 1.347-1.987 2.379-1.406l.113.07 2.678 1.804c1.424.96.538 3.146-1.1 2.915l-.137-.025-.109-.024a7.504 7.504 0 0 0 13.175.335 1.5 1.5 0 1 1 2.6 1.498c-2.317 4.02-7.119 6.152-11.815 4.893a10.503 10.503 0 0 1-7.784-10.06m1.406-5.33C5.22 2.731 10.022.6 14.718 1.857a10.503 10.503 0 0 1 7.784 10.06c.01 1.267-1.347 1.987-2.379 1.407l-.113-.07-2.678-1.805c-1.424-.959-.538-3.145 1.099-2.914l.138.025.108.023A7.504 7.504 0 0 0 5.502 8.25a1.5 1.5 0 1 1-2.598-1.498\"/>", "edit": "<path fill=\"currentColor\" d=\"m10.756 6.17 7.07 7.071-7.173 7.174a2 2 0 0 1-1.238.578L9.239 21H4.006a1.01 1.01 0 0 1-1.004-.9l-.006-.11v-5.233a2 2 0 0 1 .467-1.284l.12-.13 7.173-7.174Zm3.14-3.14a2 2 0 0 1 2.701-.117l.127.117 4.243 4.243a2 2 0 0 1 .117 2.7l-.117.128-1.726 1.726-7.07-7.071z\"/>", "link": "<path fill=\"currentColor\" d=\"m17.303 9.524 3.182 3.182a5.5 5.5 0 1 1-7.778 7.778l-1.06-1.06a1.5 1.5 0 1 1 2.12-2.122l1.062 1.061a2.5 2.5 0 0 0 3.535-3.536l-3.182-3.182a2.5 2.5 0 0 0-2.681-.56c-.162.064-.312.13-.454.196l-.464.217c-.62.28-1.097.4-1.704-.206-.872-.872-.646-1.677.417-2.41a5.502 5.502 0 0 1 7.007.642m-6.01-6.01 1.06 1.06a1.5 1.5 0 0 1-2.12 2.122l-1.061-1.06A2.5 2.5 0 1 0 5.636 9.17l3.182 3.182a2.5 2.5 0 0 0 2.681.56c.162-.064.312-.13.454-.196l.464-.217c.62-.28 1.098-.4 1.704.206.872.872.646 1.677-.417 2.41a5.502 5.502 0 0 1-7.007-.642l-3.182-3.182a5.5 5.5 0 1 1 7.778-7.778Z\"/>", "shield": "<path fill=\"currentColor\" d=\"m12.702 2.195 7 2.625A2 2 0 0 1 21 6.693v5.363a9 9 0 0 1-4.975 8.05l-3.354 1.676a1.5 1.5 0 0 1-1.342 0l-3.354-1.677A9 9 0 0 1 3 12.055V6.694A2 2 0 0 1 4.298 4.82l7-2.625a2 2 0 0 1 1.404 0M12 8a1 1 0 0 0-.993.883L11 9v2H9a1 1 0 0 0-.117 1.993L9 13h2v2a1 1 0 0 0 1.993.117L13 15v-2h2a1 1 0 0 0 .117-1.993L15 11h-2V9a1 1 0 0 0-1-1\"/>", "usdc": "<path fill=\"currentColor\" d=\"M9.882 3.122a1.5 1.5 0 0 1-.798 1.965 7.503 7.503 0 0 0 0 13.825 1.5 1.5 0 1 1-1.168 2.764A10.502 10.502 0 0 1 1.5 12c0-4.353 2.649-8.084 6.416-9.676a1.5 1.5 0 0 1 1.966.798m6.202-.798A10.503 10.503 0 0 1 22.5 12c0 4.353-2.649 8.084-6.416 9.676a1.5 1.5 0 0 1-1.168-2.764 7.503 7.503 0 0 0 0-13.825 1.5 1.5 0 1 1 1.168-2.763M12 5.5A1.5 1.5 0 0 1 13.5 7H15a1.5 1.5 0 0 1 0 3h-1.5v.5h.25a3.25 3.25 0 0 1 0 6.5h-.25a1.5 1.5 0 0 1-3 0H9a1.5 1.5 0 0 1 0-3h1.5v-.5h-.25a3.25 3.25 0 0 1 0-6.5h.25A1.5 1.5 0 0 1 12 5.5m1.75 8h-.25v.5h.25a.25.25 0 1 0 0-.5M10.5 10h-.25a.25.25 0 1 0 0 .5h.25z\"/>", "user": "<path fill=\"currentColor\" d=\"M12 13c2.396 0 4.575.694 6.178 1.672.8.488 1.484 1.064 1.978 1.69.486.615.844 1.351.844 2.138 0 .845-.411 1.511-1.003 1.986-.56.45-1.299.748-2.084.956-1.578.417-3.684.558-5.913.558s-4.335-.14-5.913-.558c-.785-.208-1.524-.506-2.084-.956C3.41 20.01 3 19.345 3 18.5c0-.787.358-1.523.844-2.139.494-.625 1.177-1.2 1.978-1.69C7.425 13.695 9.605 13 12 13m0-11a5 5 0 1 1 0 10 5 5 0 0 1 0-10\"/>", "exit": "<path fill=\"currentColor\" d=\"M12 2.5a1.5 1.5 0 0 1 0 3H7a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h4.5a1.5 1.5 0 0 1 0 3H7A3.5 3.5 0 0 1 3.5 18V6A3.5 3.5 0 0 1 7 2.5Zm6.06 5.61 2.829 2.83a1.5 1.5 0 0 1 0 2.12l-2.828 2.83a1.5 1.5 0 1 1-2.122-2.122l.268-.268H12a1.5 1.5 0 0 1 0-3h4.207l-.268-.268a1.5 1.5 0 1 1 2.122-2.121Z\"/>", "warning": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0-9a1 1 0 0 0-.993.883L11 7v6a1 1 0 0 0 1.993.117L13 13V7a1 1 0 0 0-1-1\"/>", "close_circle": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2M9.879 8.464a1 1 0 0 0-1.498 1.32l.084.095 2.12 2.12-2.12 2.122a1 1 0 0 0 1.32 1.498l.094-.083L12 13.414l2.121 2.122a1 1 0 0 0 1.498-1.32l-.083-.095L13.414 12l2.122-2.121a1 1 0 0 0-1.32-1.498l-.095.083L12 10.586z\"/>", "alert": "<path fill=\"currentColor\" d=\"m13.299 3.148 8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0M12 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0-7a1 1 0 0 0-.993.883L11 9v4a1 1 0 0 0 1.993.117L13 13V9a1 1 0 0 0-1-1\"/>", "history": "<path fill=\"currentColor\" d=\"M2.907 6.75c2.9-5.022 9.321-6.743 14.343-3.843a10.502 10.502 0 0 1 4.915 11.732c-.318 1.225-1.81 1.57-2.658.746l-.095-.1-2.251-2.587c-1.003-1.152.024-2.89 1.478-2.628l.133.03.518.134a7.5 7.5 0 1 0-2.031 7.117 1.5 1.5 0 1 1 2.104 2.139c-3.281 3.228-8.43 4.018-12.613 1.603-5.022-2.9-6.743-9.32-3.843-14.343M12 5.5a1.5 1.5 0 0 1 1.493 1.355L13.5 7v4.379l2.06 2.06a1.5 1.5 0 0 1-2.007 2.225l-.114-.103-2.5-2.5a1.5 1.5 0 0 1-.432-.913L10.5 12V7A1.5 1.5 0 0 1 12 5.5\"/>", "key": "<path fill=\"currentColor\" d=\"M10.438 4.368a6.5 6.5 0 1 1 2.252 10.66l-.269-.11-.02-.004h-.61v1.578a1.25 1.25 0 0 1-1.122 1.244l-.128.006H8.963v1.578a1.25 1.25 0 0 1-1.122 1.244l-.128.006H3.73a1.01 1.01 0 0 1-1.004-.9l-.006-.11v-2.61a1.5 1.5 0 0 1 .34-.951l.1-.11 5.5-5.501.01-.037a.25.25 0 0 0-.004-.081 6.495 6.495 0 0 1 1.772-5.902m4.242 2.828a1.5 1.5 0 1 0 2.122 2.121 1.5 1.5 0 0 0-2.122-2.12Z\"/>", "question": "<path fill=\"currentColor\" d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2m0-9.5a3.625 3.625 0 0 0-3.625 3.625 1 1 0 1 0 2 0 1.625 1.625 0 1 1 2.23 1.51c-.676.27-1.605.962-1.605 2.115V14a1 1 0 1 0 2 0c0-.244.05-.366.261-.47l.087-.04A3.626 3.626 0 0 0 12 6.5\"/>", "send": "<path fill=\"currentColor\" d=\"m21.433 4.861-6 15.5a1 1 0 0 1-1.624.362l-3.382-3.235-2.074 2.073a.5.5 0 0 1-.853-.354v-4.519L2.309 9.723a1 1 0 0 1 .442-1.691l17.5-4.5a1 1 0 0 1 1.181 1.329ZM19 6.001 8.032 13.152l1.735 1.66L19 6Z\"/>", "qr": "<path fill=\"currentColor\" d=\"M14 13a1 1 0 0 1 .993.883L15 14v6a1 1 0 0 1-1.993.117L13 20v-6a1 1 0 0 1 1-1m3 4.5a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1m3-4.5a1 1 0 0 1 .993.883L21 14v6a1 1 0 0 1-1.993.117L19 20v-6a1 1 0 0 1 1-1M9 13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zm8 0a1 1 0 0 1 .993.883L18 14v1.5a1 1 0 0 1-1.993.117L16 15.5V14a1 1 0 0 1 1-1M9 3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm10 0a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z\"/>", "copy_line": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M9 2a2 2 0 0 0-2 2v2h2V4h11v11h-2v2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm0 2h11v11H4z\"/>", "close_line": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"m12 13.414 5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586 6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z\"/>", "back": "<path fill=\"currentColor\" d=\"M3.283 10.94a1.5 1.5 0 0 0 0 2.12l5.656 5.658a1.5 1.5 0 1 0 2.122-2.122L7.965 13.5H19.5a1.5 1.5 0 0 0 0-3H7.965l3.096-3.096a1.5 1.5 0 1 0-2.122-2.121L3.283 10.94Z\"/>"};
const IMG = {"A-01": "DATAURI", "BG-cta": "DATAURI", "BG-sunset1": "DATAURI", "BG-sunset2": "DATAURI", "C-01": "DATAURI", "C-02": "DATAURI", "C-04": "DATAURI", "C-06": "DATAURI", "C-07": "DATAURI", "D-10": "DATAURI", "E-01": "DATAURI", "E-03": "DATAURI", "F-01": "DATAURI", "F-02": "DATAURI", "F-04": "DATAURI", "I-01": "DATAURI", "M-01": "DATAURI", "M-02": "DATAURI", "M-03": "DATAURI", "M-04": "DATAURI", "M-06": "DATAURI", "M-07": "DATAURI", "M-10": "DATAURI", "O-02": "DATAURI", "O-03": "DATAURI", "O-04": "DATAURI", "O-05": "DATAURI", "O-06": "DATAURI", "T-02": "DATAURI", "T-03": "DATAURI", "T-05": "DATAURI", "T-06E": "DATAURI", "W-01": "DATAURI", "W-02": "DATAURI", "W-03": "DATAURI", "W-05E": "DATAURI", "W-08": "DATAURI", "W-10": "DATAURI", "av-aryan": "DATAURI", "av-kay": "DATAURI", "pattern": "DATAURI", "phone-client": "DATAURI", "phone-contrib": "DATAURI", "promo": "DATAURI", "sky": "DATAURI", "wl-albedo": "DATAURI", "wl-freighter": "DATAURI", "wl-hana": "DATAURI", "wl-lobstr": "DATAURI", "wl-xbull": "DATAURI"};
const ROLE = 'client';
const IS_CLIENT = ROLE === 'client';

/* ================= helpers ================= */
const ic = (n, s = 20, c = '', extra = '') => `<svg class="i${extra ? ' ' + extra : ''}" width="${s}" height="${s}" viewBox="0 0 24 24"${c ? ` style="color:${c}"` : ''}>${ICONS[n] || ''}</svg>`;
const fmt = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd = n => `${fmt(n)} USDC`;
const num = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let hseed = 7;
const hex = n => Array.from({ length: n }, () => { hseed = (hseed * 9301 + 49297) % 233280; return '0123456789abcdef'[Math.floor(hseed / 233280 * 16)]; }).join('');
const newHash = () => `${hex(4)}…${hex(4)}`;
const andList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const C = { pri: '#2EBEF2', ink: '#171717', sub: '#7B7B7B', soft: '#A3A3A3', green: '#00CE5C', amber: '#F0AF30', blue: '#4797F6', red: '#FE393B' };

const PEOPLE = {
  aryan: { name: 'Aryan Roy', first: 'Aryan', addr: 'GABXR4PL2VQ8MN3TZKQ7QX', short: 'G…7QX', mid: 'GABX…Q7QX', img: 'av-aryan', bg: '#FFE1E6' },
  kay: { name: 'Kay Finley', first: 'Kay', addr: 'GCKFN7WQ3TZ8HS2NBQR4KD', short: 'G…4KD', mid: 'GCKF…R4KD', img: 'av-kay', bg: '#EFE6FF' },
  rhea: { name: 'Rhea Hull', first: 'Rhea', addr: 'GDRH2VX8MQ4WE7TYH9P1HL', short: 'G…1HL', mid: 'GDRH…P1HL', bg: '#E1F1FF', fg: '#3B82C4' },
  abbas: { name: 'Abbas Ali', first: 'Abbas', addr: 'GAAB7YH2KX9QW4ZT8C5ALI', short: 'G…ALI', mid: 'GAAB…5ALI', bg: '#FFF1DC', fg: '#C9821C' },
  sophia: { name: 'Sophia Kent', first: 'Sophia', addr: 'GBSK3NQ6RT1VW8XK2Z4KNT', short: 'G…KNT', mid: 'GBSK…4KNT', bg: '#E3F7EA', fg: '#239A5A' },
};
const ME_KEY = IS_CLIENT ? 'aryan' : 'kay';
const ME = PEOPLE[ME_KEY];

const av = (p, s = 32) => p.img
  ? `<img class="av" src="${IMG[p.img]}" width="${s}" height="${s}" alt="" style="width:${s}px;height:${s}px;background:${p.bg}">`
  : `<span class="av" style="width:${s}px;height:${s}px;background:${p.bg};color:${p.fg};font-size:${Math.round(s * .36)}px">${p.name.split(' ').map(w => w[0]).join('')}</span>`;

/* Folder illustration, exact Figma geometry (56x44) with three palettes */
const FOLDER = {
  P: ['#EAD5FC', '#E5C9FB', '#F6ECFE', '#D09FF8'],
  B: ['#D7E8FD', '#CBE2FC', '#EDF5FE', '#A3CBFB'],
  Y: ['#FCEDD1', '#FBE9C5', '#FEF7EA', '#F8D798'],
};
const folder = (k = 'P', w = 56) => {
  const [bk, st, fr, ln] = FOLDER[k];
  return `<svg class="folder" width="${w}" height="${w * 44 / 56}" viewBox="0 0 56 44" fill="none"><path d="M2 4.5C2 3.83696 2.26339 3.20107 2.73223 2.73223C3.20107 2.26339 3.83696 2 4.5 2H16.5C17.3 2 18 2.35 18.5 2.95L21 6H51.5C52.163 6 52.7989 6.26339 53.2678 6.73223C53.7366 7.20107 54 7.83696 54 8.5V39.5C54 40.163 53.7366 40.7989 53.2678 41.2678C52.7989 41.7366 52.163 42 51.5 42H4.5C3.83696 42 3.20107 41.7366 2.73223 41.2678C2.26339 40.7989 2 40.163 2 39.5V4.5Z" fill="${bk}"/><path d="M35.7514 5.85383L7.85794 8.29419C7.03266 8.3664 6.42218 9.09394 6.49438 9.91922L8.15034 28.8469C8.22254 29.6722 8.95009 30.2827 9.77537 30.2105L37.6688 27.7701C38.4941 27.6979 39.1046 26.9704 39.0324 26.1451L37.3764 7.21739C37.3042 6.39212 36.5767 5.78163 35.7514 5.85383Z" fill="#fff" stroke="${st}" stroke-width=".5"/><path d="M47.0924 7.0334L19.1607 5.08022C18.3342 5.02243 17.6175 5.64552 17.5597 6.47193L16.2343 25.4256C16.1765 26.2521 16.7996 26.9688 17.626 27.0266L45.5578 28.9798C46.3842 29.0376 47.101 28.4145 47.1588 27.5881L48.4842 8.63438C48.5419 7.80797 47.9189 7.09119 47.0924 7.0334Z" fill="#fff" stroke="${st}" stroke-width=".5"/><path d="M23.1059 10.4735L10.1553 11.6066C9.88023 11.6306 9.67674 11.8732 9.7008 12.1482C9.72487 12.4233 9.96739 12.6268 10.2425 12.6028L23.193 11.4697C23.4681 11.4457 23.6716 11.2032 23.6475 10.9281C23.6235 10.653 23.3809 10.4495 23.1059 10.4735Z" fill="${st}"/><path d="M30.8873 9.40871L20.9116 8.71115C20.6362 8.69189 20.3972 8.89958 20.378 9.17505C20.3587 9.45052 20.5664 9.68945 20.8419 9.70871L30.8175 10.4063C31.093 10.4255 31.3319 10.2178 31.3512 9.94237C31.3704 9.6669 31.1627 9.42798 30.8873 9.40871Z" fill="${st}"/><path d="M36.6982 12.3213L20.7372 11.2052C20.4617 11.1859 20.2228 11.3936 20.2035 11.6691C20.1843 11.9445 20.392 12.1835 20.6674 12.2027L36.6285 13.3188C36.9039 13.3381 37.1429 13.1304 37.1621 12.8549C37.1814 12.5795 36.9737 12.3405 36.6982 12.3213Z" fill="${st}"/><path d="M2 18.5C2 17.837 2.26339 17.2011 2.73223 16.7322C3.20107 16.2634 3.83696 16 4.5 16H51.5C52.163 16 52.7989 16.2634 53.2678 16.7322C53.7366 17.2011 54 17.837 54 18.5V39.5C54 40.163 53.7366 40.7989 53.2678 41.2678C52.7989 41.7366 52.163 42 51.5 42H4.5C3.83696 42 3.20107 41.7366 2.73223 41.2678C2.26339 40.7989 2 40.163 2 39.5V18.5Z" fill="${fr}" stroke="${st}" stroke-width=".5"/><path d="M48.5 36H39.5C39.2239 36 39 36.2239 39 36.5C39 36.7761 39.2239 37 39.5 37H48.5C48.7761 37 49 36.7761 49 36.5C49 36.2239 48.7761 36 48.5 36Z" fill="${ln}"/><path d="M48.5 38.5H42.5C42.2239 38.5 42 38.7239 42 39C42 39.2761 42.2239 39.5 42.5 39.5H48.5C48.7761 39.5 49 39.2761 49 39C49 38.7239 48.7761 38.5 48.5 38.5Z" fill="${ln}"/></svg>`;
};

/* Progress ring used on project cards (16px, matches Figma stroke 2.36) */
const ring = (frac, col) => {
  const r = 6.82, L = 2 * Math.PI * r, f = Math.max(.08, Math.min(1, frac));
  return `<svg width="16" height="16" viewBox="0 0 16 16" style="flex:none"><circle cx="8" cy="8" r="${r}" fill="none" stroke="#F5F5F5" stroke-width="2.36"/><circle cx="8" cy="8" r="${r}" fill="none" stroke="${col}" stroke-width="2.36" stroke-linecap="round" stroke-dasharray="${(L * f).toFixed(2)} ${L.toFixed(2)}" transform="rotate(-90 8 8)"/></svg>`;
};

/* Balance card dot pattern, extracted from the Figma vector */
const PAT = '48,-1.67,2.67,0,0;64.22,-2.11,3.56,0,1;75.78,-1.67,2.67,0,1;86,-2.56,4.44,1,2;91.56,-2.56,4.44,1,3;98.44,-1.22,1.78,0,0;102.67,-2.56,4.44,1,1;109.56,-1.22,1.78,0,2;114.22,-2.11,3.56,0,3;120.67,-1.22,1.78,0,3;124.89,-2.56,4.44,1,2;142.89,-1.22,1.78,0,2;148.78,-0.89,1.11,0,2;26.22,4.33,1.78,0,0;48.78,4.67,1.11,0,1;53.56,3.89,2.67,0,0;59.89,4.67,1.11,0,1;63.78,3,4.44,1,0;69.33,3,4.44,1,3;75.33,3.44,3.56,0,1;80.44,3,4.44,1,3;86.89,3.89,2.67,0,2;92.44,3.89,2.67,0,3;98.78,4.67,1.11,0,3;104,4.33,1.78,0,2;108.22,3,4.45,1,2;115.11,4.33,1.78,0,0;130.44,3,4.45,1,2;137.33,4.33,1.78,0,2;148,3.89,2.67,0,2;26.56,10.22,1.11,0,2;37.33,9.89,1.78,0,3;65.11,9.89,1.78,0,0;71,10.22,1.11,0,0;76.56,10.22,1.11,0,3;81.33,9.44,2.67,0,3;86.44,9,3.56,0,3;97.11,8.56,4.44,1,3;104,9.89,1.78,0,2;109.56,9.89,1.78,0,1;113.78,8.56,4.44,1,3;119.78,9,3.55,0,1;131.33,9.44,2.67,0,3;137.33,9.89,1.78,0,0;142.44,9.44,2.67,0,3;148.45,9.89,1.78,0,0;20.67,15.44,1.78,0,1;32.11,15.78,1.11,0,0;37.67,15.78,1.11,0,2;54.33,15.78,1.11,0,1;58.22,14.11,4.44,1,3;65.44,15.78,1.11,0,0;70.67,15.44,1.78,0,0;75.78,15,2.67,0,3;81.78,15.44,1.78,0,0;86.89,15,2.67,0,2;98.78,15.78,1.11,0,2;109.56,15.44,1.78,0,3;119.78,14.56,3.55,0,3;130.44,14.11,4.45,1,0;137.33,15.44,1.78,0,1;41.56,19.67,4.44,1,0;47.11,19.67,4.44,1,1;54.33,21.33,1.11,0,1;65.44,21.33,1.11,0,1;76.56,21.33,1.11,0,1;82.11,21.33,1.11,0,0;86.89,20.56,2.67,0,3;92.44,20.56,2.67,0,0;98.44,21,1.78,0,1;114.67,20.56,2.67,0,3;119.78,20.11,3.55,0,2;130.44,19.67,4.45,1,0;137.67,21.33,1.11,0,3;148,20.56,2.67,0,3;26.56,26.89,1.11,0,0;31.78,26.56,1.78,0,2;42.89,26.56,1.78,0,2;48.78,26.89,1.11,0,2;53.56,26.11,2.67,0,3;65.11,26.56,1.78,0,2;71,26.89,1.11,0,0;86.89,26.11,2.67,0,0;92.89,26.56,1.78,0,3;103.56,26.11,2.67,0,0;115.11,26.56,1.78,0,2;120.22,26.11,2.67,0,1;142.89,26.56,1.78,0,0;148,26.11,2.67,0,0;32.11,32.44,1.11,0,0;37.67,32.44,1.11,0,2;65.11,32.11,1.78,0,0;70.67,32.11,1.78,0,2;82.11,32.44,1.11,0,3;87.33,32.11,1.78,0,1;92.89,32.11,1.78,0,1;109.11,31.67,2.67,0,2;115.11,32.11,1.78,0,0;131.33,31.67,2.67,0,1;143.22,32.44,1.11,0,2;59.56,37.67,1.78,0,3;82.11,38,1.11,0,1;109.56,37.67,1.78,0,0;115.11,37.67,1.78,0,1;131.78,37.67,1.78,0,0';
const PATCOL = ['#E2F5FE', '#EAF8FE', '#DDF4FD', '#F5FCFF'];
const patternSvg = (() => `<svg class="pat" width="152" height="127" viewBox="0 0 152 127">${PAT.split(';').map(s => { const [x, y, w, sq, c] = s.split(',').map(Number); return sq ? `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="1" fill="${PATCOL[c]}"/>` : `<circle cx="${(x + w / 2).toFixed(2)}" cy="${(y + w / 2).toFixed(2)}" r="${(w / 2).toFixed(2)}" fill="${PATCOL[c]}"/>`; }).join('')}</svg>`)();

/* Illustration tile 48 (next-action), balloon 44 (review dialogs), slot 94 (success pages) */
const ill = k => `<div class="ill"><img src="${IMG[k]}" alt=""></div>`;
const balloon = k => `<div class="ill b44"><img src="${IMG[k]}" alt=""></div>`;
const slot = k => `<div class="slot"><img src="${IMG[k]}" alt=""></div>`;

/* Status badges */
const BADGE = {
  pending: ['Pending', 'time', C.sub], submitted: ['Submitted', 'flag', C.amber], approved: ['Approved', 'check_circle', C.blue], paid: ['Paid', 'check_circle', C.green],
  awaiting: ['Awaiting funding', 'time', C.amber], awaitc: ['Awaiting contributor', 'time', C.blue], funded: ['Funded', 'safe_lock', C.pri], progress: ['In progress', 'loading', C.blue],
  completed: ['Completed', 'check_circle', C.green], cancelled: ['Cancelled', 'close_circle', C.soft], declined: ['Declined', 'close_circle', C.soft], draft: ['Draft', 'edit', C.soft],
  confirmed: ['Confirmed', 'check_circle', C.green], connected: ['Connected', 'check_circle', C.green], processing: ['Processing', 'loading', C.blue], failed: ['Failed', 'close_circle', C.red],
};
const badge = (k, iconOnly) => { const [t, i, c] = BADGE[k]; return `<span class="badge${iconOnly ? ' icononly' : ''}" title="${t}">${ic(i, 16, c)}${iconOnly ? '' : t}</span>`; };

/* ================= data ================= */
const ms = (title, desc, amount, status = 'pending', x = {}) => ({ title, desc, amount, status, ...x });
function seed() {
  if (IS_CLIENT) return {
    bal: 2450,
    agreements: [
      { id: 'mobile-app-mvp', name: 'Mobile app MVP', desc: 'iOS and Android app for the booking flow.', client: 'aryan', contributor: 'rhea', status: 'funded', accepted: true, color: 'B', created: '3 weeks ago',
        ms: [ms('UI/UX implementation', 'Screens and design system in code.', 450, 'approved', { when: '1d ago', link: 'figma.com/proto/mvp-ui' }), ms('Booking flow', 'Search, select and pay.', 700), ms('Notifications', 'Push and email.', 450), ms('Store release', 'App Store and Play listing.', 400)] },
      { id: 'landing-page', name: 'Landing page', desc: 'Single landing page for the product launch.', client: 'aryan', contributor: 'kay', status: 'created', accepted: false, color: 'P', created: '2 days ago', createHash: 'b2c9…44e1',
        ms: [ms('Design', '', 300), ms('Build', '', 400), ms('Launch', '', 200)] },
      { id: 'api-integration', name: 'API integration', desc: 'Payments API and webhooks.', client: 'aryan', contributor: 'rhea', status: 'funded', accepted: true, color: 'B', created: '1 week ago', fundHash: '91fd…c03a',
        ms: [ms('Auth and webhooks', '', 550), ms('Sync and retries', '', 600)] },
      { id: 'token-dashboard', name: 'Token dashboard', desc: 'Read-only dashboard for token holders.', client: 'aryan', contributor: 'abbas', status: 'funded', accepted: true, color: 'Y', created: '1 month ago', fundHash: '2fe0…a71b',
        ms: [ms('Data layer', '', 400, 'paid', { when: '3w ago', hash: '5c1d…e2f0' }), ms('Charts', '', 400, 'paid', { when: '2w ago', hash: 'a3b9…11c7' }), ms('Launch', '', 400)] },
      { id: 'wallet-audit', name: 'Wallet audit', desc: 'Security review of the wallet flows.', client: 'aryan', contributor: 'abbas', status: 'completed', accepted: true, color: 'Y', created: '2 months ago', fundHash: '0a9b…c3d4',
        ms: [ms('Threat model', '', 250, 'paid', { hash: '7c3e…a1f9', when: '7w ago' }), ms('Review', '', 350, 'paid', { hash: '3b8d…e6c2', when: '6w ago' }), ms('Report', '', 200, 'paid', { hash: '9d0e…71aa', when: '5w ago' })] },
    ],
    activity: [
      { k: 'approve', title: 'You approved UI/UX implementation', sub: 'Mobile app MVP · Milestone 1', when: '3h ago', hash: '5a0d…e113', group: 'Today' },
      { k: 'create', title: 'You created Landing page', sub: '3 milestones · 900.00 USDC', tsub: 'Landing page · 3 milestones', when: '2d ago', hash: 'b2c9…44e1', group: 'This week' },
      { k: 'release', title: 'Released 400.00 USDC to Abbas Ali', sub: 'Token dashboard · Milestone 2', tsub: 'Token dashboard · Milestone 2 · to Abbas Ali', when: '4d ago', hash: 'a3b9…11c7', amount: 400, group: 'This week' },
      { k: 'fund', title: 'You funded escrow with 1,150.00 USDC', sub: 'API integration', tsub: 'API integration · into escrow', when: '6d ago', hash: '91fd…c03a', amount: 1150, group: 'This week' },
      { k: 'release', title: 'Released 400.00 USDC to Abbas Ali', sub: 'Token dashboard · Milestone 1', tsub: 'Token dashboard · Milestone 1 · to Abbas Ali', when: '2w ago', hash: '6c1d…b08e', amount: 400, group: 'Earlier' },
      { k: 'fund', title: 'You funded escrow with 2,000.00 USDC', sub: 'Mobile app MVP', tsub: 'Mobile app MVP · into escrow', when: '3w ago', hash: 'b81c…0e9a', amount: 2000, group: 'Earlier' },
      { k: 'fund', title: 'You funded escrow with 1,200.00 USDC', sub: 'Token dashboard', tsub: 'Token dashboard · into escrow', when: '1mo ago', hash: 'd2f7…9c40', amount: 1200, group: 'Earlier' },
    ],
  };
  return {
    bal: 312.4,
    agreements: [
      { id: 'website-redesign', name: 'Website redesign', desc: 'Redesign the marketing site in three milestones: wireframes, core pages and launch.', client: 'aryan', contributor: 'kay', status: 'funded', accepted: false, color: 'P', created: '1 hour ago', fundHash: 'e4c2…7d31', createHash: 'c4e9…a71b',
        ms: [ms('Wireframes', 'Sitemap, low-fidelity wireframes for 8 pages', 300), ms('Core functionality', 'Main pages and the CMS, responsive', 700), ms('Launch and handoff', 'Deploy, analytics, code and docs', 500)] },
      { id: 'mobile-app-mvp', name: 'Mobile app MVP', desc: 'iOS and Android app for the booking flow.', client: 'sophia', contributor: 'kay', status: 'funded', accepted: true, color: 'B', created: '3 weeks ago', fundHash: 'b81c…0e9a',
        ms: [ms('UI/UX implementation', '', 450, 'approved', { when: '1h ago', link: 'figma.com/proto/mvp-ui' }), ms('Booking flow', '', 700), ms('Notifications', '', 450), ms('Store release', '', 400)] },
      { id: 'brand-refresh', name: 'Brand refresh', desc: 'Logo cleanup and brand guidelines.', client: 'abbas', contributor: 'kay', status: 'funded', accepted: true, color: 'Y', created: '1 day ago', fundHash: '3c8f…b5a2',
        ms: [ms('Visual direction', '', 600), ms('Guidelines', '', 600)] },
      { id: 'landing-page', name: 'Landing page', desc: 'Single landing page for the product launch.', client: 'aryan', contributor: 'kay', status: 'created', accepted: false, color: 'P', created: '2 days ago',
        ms: [ms('Design', '', 300), ms('Build', '', 400), ms('Launch', '', 200)] },
    ],
    activity: [
      { k: 'fund', title: 'Aryan Roy funded Website redesign', sub: '1,500.00 USDC locked in escrow for you', tsub: 'Website redesign · by Aryan Roy', when: '1h ago', hash: 'e4c2…7d31', amount: 1500, group: 'Today' },
      { k: 'approve', title: 'Sophia Kent approved UI/UX implementation', sub: 'Mobile app MVP · waiting for release', when: '1h ago', group: 'Today' },
      { k: 'release', title: 'You received 600.00 USDC from Abbas Ali', sub: 'Logo refresh · Milestone 1', tsub: 'Logo refresh · Milestone 1 · from Abbas Ali', when: '2w ago', hash: '8e2a…f61d', amount: 600, group: 'Earlier', inc: true },
      { k: 'fund', title: 'Abbas Ali funded escrow with 1,200.00 USDC', sub: 'Brand refresh', tsub: 'Brand refresh · by Abbas Ali', when: '1d ago', hash: '3c8f…b5a2', amount: 1200, group: 'This week' },
    ],
  };
}

let S;
function reset(keepView) {
  const d = seed(); const v = S?.view;
  S = {
    view: keepView && v ? v : (window.innerWidth < 760 ? 'm' : 'd'),
    connected: false, route: { name: IS_CLIENT ? 'landing' : 'deeplink' },
    agreements: d.agreements, activity: d.activity, bal: d.bal,
    modal: null, ext: null, toast: null, menu: null, tab: 'overview', listTag: 'all', txTag: 'all', search: '',
    draft: IS_CLIENT ? newDraft() : null, errors: {}, hideBal: false, promo: true, journey: {},
  };
}
function newDraft() {
  return { step: 1, name: '', desc: '', addr: '', ms: [{ title: '', desc: '', amount: '' }] };
}
const EXAMPLE = {
  name: 'Website redesign', desc: 'Redesign the marketing site in three milestones: wireframes, core pages and launch.', addr: PEOPLE.kay.addr,
  ms: [{ title: 'Wireframes', desc: 'Sitemap, low-fidelity wireframes for 8 pages, one round of feedback.', amount: '300.00' },
    { title: 'Core functionality', desc: 'Build the main pages and the CMS, responsive down to 360px.', amount: '700.00' },
    { title: 'Launch and handoff', desc: 'Deploy, set up analytics, and hand over the code and docs.', amount: '500.00' }],
};

const ag = id => S.agreements.find(a => a.id === id);
const total = a => a.ms.reduce((s, m) => s + m.amount, 0);
const released = a => a.ms.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0);
const isFunded = a => a.status === 'funded' || a.status === 'completed';
const locked = a => isFunded(a) ? total(a) - released(a) : 0;
const curIdx = a => a.ms.findIndex(m => m.status !== 'paid');
const paidN = a => a.ms.filter(m => m.status === 'paid').length;
const other = a => PEOPLE[IS_CLIENT ? a.contributor : a.client];
function agState(a) {
  if (a.status === 'created') return 'awaiting';
  if (a.status === 'completed') return 'completed';
  if (a.status === 'cancelled') return 'cancelled';
  if (a.status === 'declined') return 'declined';
  if (!a.accepted) return 'awaitc';
  if (paidN(a) || a.ms.some(m => m.status !== 'pending')) return 'progress';
  return 'funded';
}
function pushAct(o) { S.activity.unshift({ when: 'Just now', group: 'Today', ...o }); }

/* ================= journey (prototype panel) ================= */
const WR = 'website-redesign';
function journeySteps() {
  const a = ag(WR); const m = a?.ms || [];
  if (IS_CLIENT) return [
    ['Connect your wallet', S.journey.connected],
    ['Create an agreement with milestones', !!a],
    ['Fund the escrow', a && isFunded(a)],
    ['Kay accepts and submits work', m.some(x => x.status !== 'pending')],
    ['Approve the milestone', m.some(x => x.status === 'approved' || x.status === 'paid')],
    ['Release the payment', m.some(x => x.status === 'paid')],
    ['Pay every milestone', a?.status === 'completed'],
  ];
  return [
    ['Open Aryan’s link and connect your wallet', S.journey.connected],
    ['Review the terms Aryan funded', S.journey.viewed],
    ['Accept the agreement', a.accepted],
    ['Submit your first milestone', m.some(x => x.status !== 'pending')],
    ['Get the milestone approved', m.some(x => x.status === 'approved' || x.status === 'paid')],
    ['Receive the payment', m.some(x => x.status === 'paid')],
    ['Get paid in full', a.status === 'completed'],
  ];
}
const LINKS = ['figma.com/proto/website-v1', 'figma.com/proto/website-v2', 'github.com/kay/website/releases/v1.0'];
function simAction() {
  if (!S.connected || S.modal || S.ext) return null;
  const a = ag(WR); if (!a || a.status !== 'funded') return null;
  const i = curIdx(a); const m = a.ms[i];
  if (IS_CLIENT) {
    const k = PEOPLE.kay;
    if (!a.accepted) return { who: k, label: 'Kay accepts the agreement', sub: 'Plays the contributor’s part', run: () => {
      a.accepted = true; pushAct({ k: 'accept', title: 'Kay Finley accepted Website redesign', sub: 'Ready to start milestone 1' });
      toast('Kay accepted Website redesign', 'View', () => go('agreement', { id: WR }));
    } };
    if (m && m.status === 'pending') return { who: k, label: `Kay submits ${m.title}`, sub: `Milestone ${i + 1} of ${a.ms.length}`, run: () => {
      m.status = 'submitted'; m.link = LINKS[i]; m.when = 'Just now';
      pushAct({ k: 'submit', title: `Kay Finley submitted ${m.title}`, sub: `Website redesign · Milestone ${i + 1}` });
      toast(`Kay submitted ${m.title} for review`, 'Review', () => go('agreement', { id: WR }));
    } };
    return null;
  }
  const p = PEOPLE.aryan;
  if (!m) return null;
  if (m.status === 'submitted') return { who: p, label: `Aryan approves ${m.title}`, sub: 'Plays the client’s part', run: () => {
    m.status = 'approved'; m.when = 'Just now';
    pushAct({ k: 'approve', title: `Aryan Roy approved ${m.title}`, sub: `Website redesign · waiting for release` });
    toast(`Aryan approved ${m.title}. Payment comes next.`, 'View', () => go('agreement', { id: WR }));
  } };
  if (m.status === 'approved') return { who: p, label: `Aryan releases ${usd(m.amount)}`, sub: `Milestone ${i + 1} of ${a.ms.length}`, run: () => {
    m.status = 'paid'; m.hash = newHash(); m.when = 'Just now'; S.bal += m.amount;
    if (a.ms.every(x => x.status === 'paid')) a.status = 'completed';
    pushAct({ k: 'release', title: `You received ${usd(m.amount)} from Aryan Roy`, sub: `Website redesign · Milestone ${i + 1}`, hash: m.hash, amount: m.amount, inc: true, tsub: `Website redesign · Milestone ${i + 1} · from Aryan Roy` });
    S.modal = { t: 'received', id: WR, i };
  } };
  return null;
}

/* ================= navigation ================= */
function go(name, params = {}) {
  S.route = { name, ...params }; S.menu = null; S.errors = {};
  if (name === 'agreement') { S.tab = 'overview'; if (!IS_CLIENT && params.id === WR) S.journey.viewed = true; }
  render(true);
}
let toastTimer;
function toast(msg, action, fn) {
  S.toast = { msg, action, fn }; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { S.toast = null; render(); }, 4200);
}

/* ================= transaction flows ================= */
/* A transaction moves review -> wait (Freighter popup) -> pending -> done, or -> declined. */
const TX = {
  create: { hero: null, ball: 'I-01' }, fund: { hero: 'F-01' }, approve: { hero: 'M-03' }, release: { ball: 'I-01' },
  submit: { hero: 'M-01' }, accept: {}, decline: { hero: 'C-06' }, cancel: { hero: 'C-01' }, withdraw: { ball: 'I-01' },
};
function txInfo(md) {
  const a = md.id ? ag(md.id) : null; const m = a && md.i !== undefined ? a.ms[md.i] : null;
  const d = S.draft; const k = a ? PEOPLE[a.contributor] : null; const cl = a ? PEOPLE[a.client] : null;
  switch (md.kind) {
    case 'create': { const t = d.ms.reduce((s, x) => s + parseFloat(x.amount), 0); const kp = Object.values(PEOPLE).find(p => p.addr === d.addr.trim());
      return { verb: 'create', what: `create ${d.name}`, fn: 'create_agreement', ext: 'Create agreement', amountTxt: null,
        rows: [['Agreement', esc(d.name)], ['Contributor', kp ? `${kp.name} · ${kp.short}` : `${d.addr.slice(0, 1)}…${d.addr.slice(-3)}`], ['Milestones', `${d.ms.length} · ${andList(d.ms.map(x => num(parseFloat(x.amount))))}`], ['Total', `${fmt(t)} test USDC`], ['Network fee', '≈ 0.00001 XLM']] }; }
    case 'fund': return { verb: 'fund', what: `lock ${usd(total(a))}`, fn: 'fund', ext: 'Fund escrow', rows: [['Agreement', esc(a.name)], ['Amount', `${fmt(total(a))} test USDC`], ['To', 'Escrow contract · C…E2M'], ['Network fee', '≈ 0.00001 XLM']] };
    case 'approve': return { verb: 'approve', what: `approve ${m.title}`, fn: 'approve_milestone', ext: 'Approve milestone', rows: [['Agreement', esc(a.name)], ['Milestone', `${md.i + 1} of ${a.ms.length} · ${esc(m.title)}`], ['Moves funds', 'No'], ['Network fee', '≈ 0.00001 XLM']] };
    case 'release': return { verb: 'release', what: `release ${usd(m.amount)}`, fn: 'release', ext: 'Release payment', rows: [['Milestone', `${md.i + 1} of ${a.ms.length} · ${esc(m.title)}`], ['To', `${k.name} · ${k.mid}`], ['Amount', `${fmt(m.amount)} test USDC`], ['Network fee', '≈ 0.00001 XLM']] };
    case 'submit': return { verb: 'submit', what: `submit ${m.title}`, fn: 'submit_milestone', ext: 'Submit milestone', rows: [['Agreement', esc(a.name)], ['Milestone', `${md.i + 1} of ${a.ms.length} · ${esc(m.title)}`], ['Link', esc((md.link || '').replace(/^https?:\/\//, ''))], ['Network fee', '≈ 0.00001 XLM']] };
    case 'accept': return { verb: 'accept', what: `accept ${a.name}`, fn: 'accept', ext: 'Accept agreement', rows: [['Agreement', esc(a.name)], ['Client', `${cl.name} · ${cl.short}`], ['Escrow', `${fmt(total(a))} USDC · funded`], ['Network fee', '≈ 0.00001 XLM']] };
    case 'decline': return { verb: 'decline', what: `decline ${a.name}`, fn: 'decline', ext: 'Decline agreement', rows: [['Agreement', esc(a.name)], ['Refund to client', usd(locked(a))], ['Network fee', '≈ 0.00001 XLM']] };
    case 'cancel': return { verb: 'cancel', what: `cancel ${a.name}`, fn: 'cancel', ext: 'Cancel agreement', rows: [['Agreement', esc(a.name)], ['Funds moved', 'None'], ['Network fee', '≈ 0.00001 XLM']] };
  }
}
function startTx(kind, extra = {}) { S.modal = { t: 'tx', kind, step: TX[kind].hero || TX[kind].ball ? 'review' : 'wait', ...extra }; if (S.modal.step === 'wait') S.ext = true; S.menu = null; render(); }
function txSign() { S.modal.step = 'wait'; S.ext = true; render(); }
function txApprove() {
  S.ext = null; const md = S.modal; md.step = 'pending'; md.hash = newHash(); render();
  setTimeout(() => { if (S.modal === md && md.step === 'pending') { txDone(md); render(); } }, 1900);
}
function txReject() { S.ext = null; S.modal.step = 'declined'; render(); }
function txDone(md) {
  const a = md.id ? ag(md.id) : null; const m = a && md.i !== undefined ? a.ms[md.i] : null; const h = md.hash;
  switch (md.kind) {
    case 'create': {
      const d = S.draft; const t = d.ms.reduce((s, x) => s + parseFloat(x.amount), 0);
      const id = ag(WR) ? 'agreement-' + S.agreements.length : WR; const p = Object.keys(PEOPLE).find(k => PEOPLE[k].addr === d.addr.trim()) || 'kay';
      S.agreements.unshift({ id, name: d.name, desc: d.desc, client: 'aryan', contributor: p, status: 'created', accepted: false, color: 'P', created: 'just now', createHash: h, isNew: true,
        ms: d.ms.map(x => ms(x.title, x.desc, parseFloat(x.amount))) });
      pushAct({ k: 'create', title: `You created ${d.name}`, sub: `${plural(d.ms.length, 'milestone')} · ${usd(t)}`, tsub: `${d.name} · ${plural(d.ms.length, 'milestone')}`, hash: h });
      S.modal = null; S.draft = newDraft(); go('created', { id }); return;
    }
    case 'fund': a.status = 'funded'; a.fundHash = h; S.bal -= total(a); pushAct({ k: 'fund', title: `You funded escrow with ${usd(total(a))}`, sub: a.name, tsub: `${a.name} · into escrow`, hash: h, amount: total(a) }); md.step = 'done'; return;
    case 'approve': m.status = 'approved'; m.approveHash = h; pushAct({ k: 'approve', title: `You approved ${m.title}`, sub: `${a.name} · Milestone ${md.i + 1}`, hash: h }); S.modal = null; toast(`${m.title} approved. Release the payment when you’re ready.`); return;
    case 'release': m.status = 'paid'; m.hash = h; m.when = 'Just now'; if (a.ms.every(x => x.status === 'paid')) a.status = 'completed';
      pushAct({ k: 'release', title: `Released ${usd(m.amount)} to ${PEOPLE[a.contributor].name}`, sub: `${a.name} · Milestone ${md.i + 1}`, tsub: `${a.name} · Milestone ${md.i + 1} · to ${PEOPLE[a.contributor].name}`, hash: h, amount: m.amount }); md.step = 'done'; return;
    case 'submit': m.status = 'submitted'; m.link = (md.link || '').replace(/^https?:\/\//, ''); m.note = md.note; m.when = 'Just now';
      pushAct({ k: 'submit', title: `You submitted ${m.title}`, sub: `${a.name} · Milestone ${md.i + 1}`, hash: h }); S.modal = null; toast(`${m.title} submitted. Aryan can review it now.`); return;
    case 'accept': a.accepted = true; pushAct({ k: 'accept', title: `You accepted ${a.name}`, sub: `${PEOPLE[a.client].first} can see you’ve started`, hash: h }); S.modal = null; toast(`Accepted. ${PEOPLE[a.client].first} can see you’ve started.`); return;
    case 'decline': a.status = 'declined'; pushAct({ k: 'cancel', title: `You declined ${a.name}`, sub: `${usd(total(a))} goes back to ${PEOPLE[a.client].name}`, hash: h }); S.modal = null; toast(`You declined ${a.name}`); return;
    case 'cancel': a.status = 'cancelled'; pushAct({ k: 'cancel', title: `You cancelled ${a.name}`, sub: 'Unfunded, nothing to refund', hash: h }); S.modal = null; toast(`${a.name} was cancelled`); return;
  }
}

/* ================= actions ================= */
const A = {
  view: v => { S.view = v; render(true); },
  restart: () => { reset(true); render(true); },
  sim: () => { const s = simAction(); if (s) { s.run(); render(); } },
  connect: () => { S.modal = { t: 'connect' }; render(); },
  pickWallet: w => { S.modal = { t: 'connecting', w }; render(); setTimeout(() => { if (S.modal?.t === 'connecting') { S.modal = { t: 'connected', w }; render(); } }, 1500); },
  walletDecline: () => { if (S.modal?.t === 'connecting') { S.modal = { t: 'connDeclined', w: S.modal.w }; render(); } },
  toLanding: v => { go('landing'); if (v) setTimeout(() => A.scrollTo(v), 30); },
  enter: () => { const dl = S.route.name === 'deeplink'; S.connected = true; S.journey.connected = true; S.modal = null; if (dl) { S.fromLink = true; go('agreement', { id: WR }); } else go('dashboard'); },
  close: () => { if (S.modal?.t === 'tx' && S.modal.step === 'wait') { S.ext = null; } S.modal = null; S.menu = null; render(); },
  closeToast: () => { S.toast = null; render(); },
  toastGo: () => { const f = S.toast?.fn; S.toast = null; f && f(); render(); },
  nav: r => go(r),
  open: id => go('agreement', { id }),
  tab: t => { S.tab = t; render(); },
  listTag: t => { S.listTag = t; render(); },
  txTag: t => { S.txTag = t; render(); },
  hideBal: () => { S.hideBal = !S.hideBal; render(); },
  copy: v => { try { navigator.clipboard?.writeText(v); } catch (e) {} toast('Copied to clipboard'); render(); },
  explorer: h => { toast(`Opens ${h} on stellar.expert (Testnet)`); render(); },
  noop: () => {},
  promoClose: () => { S.promo = false; render(); },
  promo: () => { toast('Opens the MileVault listing on the App Store'); render(); },
  menu: (k, w, el) => {
    if (S.menu?.k === k) { S.menu = null; render(); return; }
    const r = el.getBoundingClientRect(); const b = document.querySelector('.app').getBoundingClientRect(); const s = scale();
    S.menu = { k, x: (b.right - r.right) / s, y: (r.bottom - b.top) / s + 6 }; render();
  },
  wApprove: txApprove, wReject: txReject, txSign,
  retry: () => { S.modal.step = 'wait'; S.ext = true; render(); },
  disconnect: () => { S.modal = { t: 'disconnect' }; S.menu = null; render(); },
  doDisconnect: () => { S.connected = false; S.modal = null; go('landing'); toast('Wallet disconnected. Nothing was signed.'); render(); },
  switchWallet: () => { S.modal = { t: 'connect', sw: true }; render(); },
  faucet: () => { toast('Opens the Stellar Testnet faucet'); render(); },
  scrollTo: id => { const el = document.getElementById(id); const sc = document.getElementById('sc'); if (el && sc) sc.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' }); },

  /* client: create */
  newAg: () => { S.draft = newDraft(); go('new'); },
  fillExample: () => { const st = S.draft.step; S.draft = JSON.parse(JSON.stringify(EXAMPLE)); S.draft.step = st; S.errors = {}; render(); },
  step: n => { n = +n; if (n > S.draft.step && !validate(S.draft.step)) { render(); return; } S.draft.step = n; S.errors = {}; render(true); },
  addMs: () => { if (S.draft.ms.length >= 10) return; S.draft.ms.push({ title: '', desc: '', amount: '' }); render(); setTimeout(() => document.querySelector(`[data-f="ms.${S.draft.ms.length - 1}.title"]`)?.focus(), 30); },
  dupMs: i => { if (S.draft.ms.length >= 10) return; S.draft.ms.splice(+i + 1, 0, { ...S.draft.ms[+i] }); S.errors = {}; render(); },
  delMs: i => { if (S.draft.ms.length <= 1) { toast('An agreement needs at least one milestone'); render(); return; } S.draft.ms.splice(+i, 1); S.errors = {}; render(); },
  paste: () => { S.draft.addr = PEOPLE.kay.addr; delete S.errors.addr; render(); },
  createConfirm: () => startTx('create'),
  /* client: fund / approve / release / cancel */
  fund: id => { const a = id ? ag(id) : S.agreements.find(x => x.status === 'created'); if (!a) { toast('Nothing is waiting for funding'); render(); return; } if (S.route.name !== 'agreement' || S.route.id !== a.id) { S.route = { name: 'agreement', id: a.id }; S.tab = 'overview'; } startTx('fund', { id: a.id }); },
  approve: (id, i) => { const a = ag(id); if (i === undefined) i = a.ms.findIndex(m => m.status === 'submitted'); startTx('approve', { id, i: +i }); },
  release: (id, i) => { const a = ag(id); if (i === undefined) i = a.ms.findIndex(m => m.status === 'approved'); startTx('release', { id, i: +i }); },
  releaseAny: () => { for (const a of S.agreements) { const i = a.ms.findIndex(m => m.status === 'approved'); if (i > -1 && a.client === ME_KEY) { S.route = { name: 'agreement', id: a.id }; S.tab = 'overview'; startTx('release', { id: a.id, i }); render(true); return; } } toast('Nothing is approved and ready to release'); render(); },
  cancel: id => startTx('cancel', { id }),
  openLink: (id, i) => { const m = ag(id).ms[+i]; toast(`Opens ${m.link} in a new tab`); render(); },
  /* contributor */
  accept: id => startTx('accept', { id }),
  decline: id => startTx('decline', { id }),
  submit: (id, i) => { const a = ag(id); if (i === undefined) i = curIdx(a); startTx('submit', { id, i: +i, link: '', note: '' }); setTimeout(() => document.querySelector('[data-f="m.link"]')?.focus(), 60); },
  submitAny: () => { const a = S.agreements.find(x => x.status === 'funded' && x.accepted && x.ms[curIdx(x)]?.status === 'pending' && x.contributor === ME_KEY); if (!a) { const n = S.agreements.find(x => x.status === 'funded' && !x.accepted); toast(n ? `Accept ${n.name} first, then submit your work` : 'Nothing is ready to submit right now'); render(); return; } S.route = { name: 'agreement', id: a.id }; S.tab = 'overview'; A.submit(a.id); },
  fillLink: () => { const md = S.modal; md.link = 'https://' + (LINKS[md.i] || 'figma.com/proto/work'); md.note = ['Wireframes for all 8 pages, with notes on each.', 'All pages built and the CMS is live on staging.', 'Deployed, analytics on, docs in the README.'][md.i] || ''; S.errors = {}; render(); },
  submitReview: () => {
    const md = S.modal; const link = (md.link || '').trim();
    if (!link) { S.errors = { link: 'Add a link so Aryan can review your work' }; render(); return; }
    if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(link)) { S.errors = { link: 'That doesn’t look like a link. Try https://…' }; render(); return; }
    txSign();
  },
};

function validate(step) {
  const d = S.draft; const e = {};
  if (step === 1) {
    if (!d.name.trim()) e.name = 'Give the agreement a name';
    const ad = d.addr.trim();
    if (!ad) e.addr = 'Paste your contributor’s Stellar address';
    else if (ad === ME.addr) e.addr = 'That’s your own address. Use your contributor’s.';
    else if (!/^G[A-Z0-9]{15,55}$/.test(ad)) e.addr = 'Stellar addresses start with G and use capitals and numbers only';
  }
  if (step === 2) d.ms.forEach((m, i) => {
    if (!m.title.trim()) e[`ms.${i}.title`] = 'Add a title';
    const v = parseFloat(m.amount);
    if (!m.amount || isNaN(v)) e[`ms.${i}.amount`] = 'Add an amount';
    else if (v <= 0) e[`ms.${i}.amount`] = 'Amount must be more than 0';
    else if (!/^\d+(\.\d{1,2})?$/.test(String(m.amount).trim())) e[`ms.${i}.amount`] = 'Use up to 2 decimal places';
  });
  S.errors = e; return !Object.keys(e).length;
}

/* ================= chrome ================= */
const SAFARI = {
  side: `<svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="#6B6B6B"><path d="M4 1.5H18C19.6569 1.5 21 2.84315 21 4.5V13.5C21 15.1569 19.6569 16.5 18 16.5H4C2.34315 16.5 1 15.1569 1 13.5V4.5C1 2.84315 2.34315 1.5 4 1.5Z" stroke-width="1.4"/><path d="M8 1.5V16.5" stroke-width="1.4"/><path d="M3.59998 5H5.79998M3.59998 7.6H5.79998M3.59998 10.2H5.79998" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  back: `<svg width="12" height="18" viewBox="0 0 12 18" fill="none"><path d="M9.00005 2.5L2.80005 9L9.00005 15.5" stroke="#6B6B6B" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  fwd: `<svg width="12" height="18" viewBox="0 0 12 18" fill="none"><path d="M3 2.5L9.2 9L3 15.5" stroke="#BDBDBD" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  shield: `<svg width="16" height="19" viewBox="0 0 16 19" fill="none"><path d="M8 1.20001L14.5 3.60001V9.00001C14.5 13 11.5 16 8 17.6C4.5 16 1.5 13 1.5 9.00001V3.60001L8 1.20001Z" stroke="#6B6B6B" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 1.20001L1.5 3.60001V9.00001C1.5 13 4.5 16 8 17.6V1.20001Z" fill="#6B6B6B"/></svg>`,
  lock: `<svg width="10" height="13" viewBox="0 0 10 13" fill="none"><path d="M2.80005 5.99998V4.29998C2.80005 3.7165 3.03183 3.15692 3.44441 2.74434C3.85699 2.33176 4.41657 2.09998 5.00005 2.09998C5.58353 2.09998 6.1431 2.33176 6.55568 2.74434C6.96826 3.15692 7.20005 3.7165 7.20005 4.29998V5.99998" stroke="#8A8A8A" stroke-width="1.3"/><path d="M7.6 6H2.4C1.6268 6 1 6.6268 1 7.4V11.1C1 11.8732 1.6268 12.5 2.4 12.5H7.6C8.3732 12.5 9 11.8732 9 11.1V7.4C9 6.6268 8.3732 6 7.6 6Z" fill="#8A8A8A"/></svg>`,
  reload: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#7A7A7A" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7.50002C11.9847 8.59758 11.6087 9.65962 10.9299 10.5223C10.2512 11.3849 9.30741 12.0002 8.24424 12.2733C7.18107 12.5463 6.0576 12.4619 5.04716 12.0331C4.03672 11.6043 3.19547 10.8548 2.65321 9.90047C2.11095 8.9461 1.89782 7.8398 2.0467 6.75228C2.19557 5.66475 2.69819 4.65644 3.47699 3.88291C4.25579 3.10938 5.26749 2.61362 6.35601 2.47214C7.44452 2.33065 8.54934 2.55129 9.50001 3.10002"/><path d="M7.59998 1.20001L9.99998 3.20001L7.79998 5.40001"/></svg>`,
  dl: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#6B6B6B" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2999 11C20.2999 16.1363 16.1362 20.3 11 20.3C5.8637 20.3 1.69995 16.1363 1.69995 11C1.69995 5.86376 5.8637 1.70001 11 1.70001C16.1362 1.70001 20.2999 5.86376 20.2999 11Z"/><path d="M11 6.20001V15.2M7.30005 11.8L11 15.4L14.7 11.8"/></svg>`,
  share: (c = '#6B6B6B') => `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6.3 8H4.2C3.88174 8 3.57652 8.12643 3.35147 8.35147C3.12643 8.57652 3 8.88174 3 9.2V19.8C3 20.1183 3.12643 20.4235 3.35147 20.6485C3.4629 20.76 3.59519 20.8483 3.74078 20.9087C3.88637 20.969 4.04241 21 4.2 21H13.8C14.1183 21 14.4235 20.8736 14.6485 20.6485C14.8736 20.4235 15 20.1183 15 19.8V9.2C15 8.88174 14.8736 8.57652 14.6485 8.35147C14.4235 8.12643 14.1183 8 13.8 8H11.7"/><path d="M9.00005 1.6V14M5.80005 4.7L9.00005 1.5L12.2 4.7"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2V16M2 9H16" stroke="#6B6B6B" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  tabs: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#6B6B6B" stroke-width="1.4"><path d="M7 6.5V5C7 4.20435 7.31607 3.44129 7.87868 2.87868C8.44129 2.31607 9.20435 2 10 2H17C17.7956 2 18.5587 2.31607 19.1213 2.87868C19.6839 3.44129 20 4.20435 20 5V12C20 12.7956 19.6839 13.5587 19.1213 14.1213C18.5587 14.6839 17.7956 15 17 15H15.5"/><path d="M5 7H12C13.6569 7 15 8.34315 15 10V17C15 18.6569 13.6569 20 12 20H5C3.34315 20 2 18.6569 2 17V10C2 8.34315 3.34315 7 5 7Z"/></svg>`,
  cell: `<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#000"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#000"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#000"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#000"/></svg>`,
  wifi: `<svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M1.30005 4.30001C2.23289 3.33218 3.35127 2.56236 4.58836 2.03656C5.82545 1.51075 7.15585 1.23975 8.50005 1.23975C9.84425 1.23975 11.1746 1.51075 12.4117 2.03656C13.6488 2.56236 14.7672 3.33218 15.7 4.30001" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="black"/><path d="M4 7.00003C4.57933 6.38877 5.27712 5.90195 6.0508 5.56927C6.82448 5.23658 7.65782 5.065 8.5 5.065C9.34218 5.065 10.1755 5.23658 10.9492 5.56927C11.7229 5.90195 12.4207 6.38877 13 7.00003" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="black"/><path d="M8.4999 11.6L6.3999 9.50003C6.96069 8.95035 7.71464 8.64246 8.4999 8.64246C9.28516 8.64246 10.0391 8.95035 10.5999 9.50003L8.4999 11.6Z" fill="black" stroke-width="0.8" stroke-linejoin="round" stroke="black"/></svg>`,
  batt: `<svg width="28" height="13" viewBox="0 0 28 13" fill="none"><path d="M4.3 0.5H20.7C22.7987 0.5 24.5 2.20132 24.5 4.3V8.7C24.5 10.7987 22.7987 12.5 20.7 12.5H4.3C2.20132 12.5 0.5 10.7987 0.5 8.7V4.3C0.5 2.20132 2.20132 0.5 4.3 0.5Z" stroke="black" stroke-opacity="0.35"/><path d="M11 2.20001H4.39995C3.18492 2.20001 2.19995 3.18499 2.19995 4.40001V8.60001C2.19995 9.81504 3.18492 10.8 4.39995 10.8H11C12.215 10.8 13.2 9.81504 13.2 8.60001V4.40001C13.2 3.18499 12.215 2.20001 11 2.20001Z" fill="black"/><path d="M26 4.5V8.5C26.5304 8.5 27.0391 8.28929 27.4142 7.91421C27.7893 7.53914 28 7.03043 28 6.5C28 5.96957 27.7893 5.46086 27.4142 5.08579C27.0391 4.71071 26.5304 4.5 26 4.5Z" fill="black" fill-opacity="0.4"/></svg>`,
  tr: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M18.8 5.5H9.7C8.48497 5.5 7.5 6.48497 7.5 7.7V18.8C7.5 20.015 8.48497 21 9.7 21H18.8C20.015 21 21 20.015 21 18.8V7.7C21 6.48497 20.015 5.5 18.8 5.5Z" fill="white" stroke-width="1.1" stroke="#8E8E93"/><path d="M10.5 10.5H18M14.2 8.79999V10.5M11.6 11.8L17.2 18.6M17 11.8L11.6 18.6" stroke-width="1.1" stroke-linecap="round" stroke="#8E8E93"/><path d="M11.8 1H3.2C1.98497 1 1 1.98497 1 3.2V14.3C1 15.515 1.98497 16.5 3.2 16.5H11.8C13.015 16.5 14 15.515 14 14.3V3.2C14 1.98497 13.015 1 11.8 1Z" fill="#8E8E93"/><path d="M10.4001 7.09997C9.9711 6.42701 9.31905 5.9264 8.55812 5.68579C7.79718 5.44518 6.97586 5.47992 6.23795 5.78391C5.50005 6.08791 4.8926 6.64179 4.52196 7.34857C4.15133 8.05536 4.04113 8.87 4.21066 9.64985C4.3802 10.4297 4.81866 11.1251 5.44927 11.6142C6.07989 12.1033 6.86246 12.355 7.65998 12.3252C8.45749 12.2954 9.21911 11.986 9.81148 11.4512C10.4038 10.9164 10.7892 10.1903 10.9001 9.39997H7.80009" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="white"/></svg>`,
  info: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M12.3 6.50001C12.3 9.70326 9.7032 12.3 6.49995 12.3C3.2967 12.3 0.699951 9.70326 0.699951 6.50001C0.699951 3.29676 3.2967 0.700012 6.49995 0.700012C9.7032 0.700012 12.3 3.29676 12.3 6.50001Z" stroke-width="1.1" stroke="black"/><path d="M6.5 5.79999V9.39999" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" stroke="black"/><path d="M6.49995 4.69998C6.94178 4.69998 7.29995 4.3418 7.29995 3.89998C7.29995 3.45815 6.94178 3.09998 6.49995 3.09998C6.05812 3.09998 5.69995 3.45815 5.69995 3.89998C5.69995 4.3418 6.05812 4.69998 6.49995 4.69998Z" fill="black"/></svg>`,
};
const urlFor = () => S.route.name === 'deeplink' || S.fromLink && S.route.name === 'agreement' && S.route.id === WR ? 'milevault.app/a/MV-1042' : 'milevault.app';
function safariDesktop() {
  return `<div class="sbar"><div class="l"><div class="wc"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i></div>${SAFARI.side}<div style="display:flex;gap:20px">${SAFARI.back}${SAFARI.fwd}</div></div>
  <div class="c">${SAFARI.shield}<div class="addr"><span style="width:14px"></span><div class="url">${SAFARI.lock}${urlFor()}</div>${SAFARI.reload}</div><span style="width:16px"></span></div>
  <div class="r">${SAFARI.dl}${SAFARI.share()}${SAFARI.plus}${SAFARI.tabs}</div></div>`;
}
function safariMobile() {
  return `<div class="mbar"><div class="st"><div class="tm">9:41</div><div class="lv">${SAFARI.cell}${SAFARI.wifi}${SAFARI.batt}</div></div>
  <div class="ar"><div class="af">${SAFARI.tr}<div class="url">${SAFARI.info}${urlFor()}</div>${SAFARI.share('#8E8E93')}</div></div></div>`;
}
const NAVS = [['dashboard', 'Dashboard', 'home'], ['agreements', 'Agreements', 'file'], ['transactions', 'Transactions', 'transfer'], ['wallets', 'Wallets', 'wallet']];
const navOn = k => { const r = S.route.name; return r === k || (k === 'agreements' && ['agreement', 'new', 'created'].includes(r)); };
function sidebar() {
  return `<aside class="side"><div class="top">
    <div class="user" data-a="menu" data-v="user">${av(ME, 32)}<div><div class="nm">${ME.name}</div><div class="wl"><span class="gdot"></span><span class="ad">${ME.short}</span><span class="sbadge">Testnet</span></div></div><span class="chev">${ic('down_line', 16)}</span></div>
    <nav class="nav">${NAVS.map(([k, l, i]) => `<button class="${navOn(k) ? 'on' : ''}" data-a="nav" data-v="${k}">${ic(i, 24)}${l}</button>`).join('')}</nav></div>
  <div class="bot">${S.promo ? `<div class="promo" data-a="promo"><div class="media"><img src="${IMG.promo}" alt=""><button class="x" data-a="promoClose" aria-label="Dismiss">${ic('close', 16)}</button></div>
    <div class="prow"><span class="tile">${ic('lock', 18)}</span><div class="tx"><b>Available on iOS</b><small>Get the app on appstore</small></div>${ic('arrow_up_right', 14)}</div></div>` : ''}
    <div class="flinks"><span>Developers</span><span>·</span><span>Privacy</span><span>·</span><span>Terms</span></div></div></aside>`;
}
function tabBar() {
  const t = ([k, l, i]) => `<button class="${navOn(k) ? 'on' : ''}" data-a="nav" data-v="${k}">${ic(i, 24)}<span>${l}</span></button>`;
  return `<nav class="tabbar">${t(NAVS[0])}${t(NAVS[1])}<div class="fabw"><button class="fab" data-a="${IS_CLIENT ? 'newAg' : 'submitAny'}" aria-label="${IS_CLIENT ? 'New agreement' : 'Submit milestone'}">${ic('add', 24)}</button></div>${t(NAVS[2])}${t(NAVS[3])}</nav>`;
}
function mobileTop() {
  const r = S.route.name;
  if (r === 'agreement' || r === 'new' || r === 'created') {
    const title = r === 'agreement' ? 'Agreement' : r === 'new' ? 'New agreement' : 'Agreement created';
    return `<div class="mtop c"><button class="ib" data-a="nav" data-v="${r === 'created' ? 'dashboard' : 'agreements'}">${ic('back', 20)}</button><h2>${title}</h2>${r === 'agreement' ? `<button class="ib" data-a="menu" data-v="ag">${ic('more', 20)}</button>` : '<span class="ib"></span>'}</div>`;
  }
  const title = { dashboard: 'Dashboard', agreements: 'Agreements', transactions: 'Transactions', wallets: 'Wallets' }[r];
  return `<div class="mtop"><h2>${title}</h2><div class="wchip" data-a="menu" data-v="user">${av(ME, 24)}${ME.short}<span class="gdot"></span></div></div>`;
}

/* ================= screens ================= */
function deeplinkPage() {
  const m = S.view === 'm'; const a = ag(WR);
  return `<div class="lp dl"><div class="lnav dl"><div class="logo" data-a="toLanding"><span class="mk">${ic('safe_lock', 16)}</span>MileVault</div>
    ${m ? '' : `<div class="links"><span data-a="toLanding" data-v="how">How it works</span><span data-a="toLanding" data-v="clients">For clients</span><span data-a="toLanding" data-v="contributors">For contributors</span><span data-a="toLanding" data-v="security">Security</span></div>`}
    <button class="lbtn s p" data-a="connect">${ic('wallet', 16)}${m ? 'Connect' : 'Connect wallet'}</button></div>
  <div class="dlwrap"><div class="dlcard">${heroMedia('D-10')}
    <h3>Connect to view this agreement</h3>
    <p>Aryan Roy shared ${esc(a.name)} with you. Connect the wallet that’s part of this agreement to see its milestones and payments.</p>
    <div class="dlag">${folder(a.color, 40)}<div class="tx"><b>${esc(a.name)}</b><small>MV-1042 · ${usd(total(a))} · ${plural(a.ms.length, 'milestone')}</small></div></div>
    <button class="btn pri h44" data-a="connect">${ic('wallet', 16)}<span>Connect wallet</span></button>
    <div class="note">${ic('info', 16)}<span>Only the client and contributor wallets can open this agreement. Stellar Testnet.</span></div></div></div></div>`;
}
function landing() {
  const m = S.view === 'm';
  const step = (k, t, d) => `<div class="lcard"><div class="ilw"><img src="${IMG[k]}" alt=""></div><div><h4>${t}</h4><p>${d}</p></div></div>`;
  const feat = (i, t, d) => `<div class="lcard"><div class="itile">${ic(i, 24)}</div><div><h4>${t}</h4><p>${d}</p></div></div>`;
  const bullets = l => `<div class="bullets">${l.map(x => `<div>${ic('check_circle', 22)}${x}</div>`).join('')}</div>`;
  const cw = (cls = 'l') => `<button class="lbtn ${cls} p" data-a="connect">${ic('wallet', cls === 's' ? 16 : 20)}Connect wallet</button>`;
  return `<div class="lp"><div class="lnav"><div class="logo" data-a="scrollTo" data-v="top"><span class="mk">${ic('safe_lock', 16)}</span>MileVault</div>
    <div class="links"><span data-a="scrollTo" data-v="how">How it works</span><span data-a="scrollTo" data-v="clients">For clients</span><span data-a="scrollTo" data-v="contributors">For contributors</span><span data-a="scrollTo" data-v="security">Security</span></div>${cw('s')}</div>
  <section class="lhero" id="top"><span class="eyebrow">Live on Stellar Testnet</span><h1>Pay contributors,${m ? ' ' : '<br>'}milestone by milestone.</h1>
    <p>Lock test USDC in a Soroban escrow and release each payment when the work is approved. MileVault never holds your keys.</p>
    <div class="ctas">${cw()}<button class="lbtn l o" data-a="scrollTo" data-v="how">See how it works</button></div><small>No sign-up. Connect a Stellar wallet to start.</small></section>
  <div class="pstage"><div class="frame">${safariDesktop()}<div class="app">${sidebarStatic()}<div class="main"><div class="col">${dashboard(true)}</div></div></div></div></div>
  <div class="lcontent">
    <section id="how"><div class="shead" style="width:${m ? 'auto' : '720px'}"><span class="eyebrow">How it works</span><h2>Escrow in five steps.</h2><p>The PRD example: a 1,500.00 USDC agreement in three milestones.</p></div>
      <div class="steps5"><div class="r">${step('O-02', '1. Create', 'The client sets up Website redesign with 3 milestones: 300, 700 and 500 USDC.')}${step('O-03', '2. Fund', 'The client locks 1,500.00 test USDC in the contract. Nobody can move it alone.')}${step('O-04', '3. Submit', 'The contributor finishes milestone 1 and submits it with a link to the work.')}</div>
      <div class="r">${step('O-05', '4. Approve', 'The client reviews and approves. Approved means ready to pay, not paid.')}${step('O-06', '5. Release', 'The client releases 300.00 USDC. The contract pays out, 1,200.00 stays locked.')}</div></div></section>
    <section class="split" id="clients"><div class="tx"><div class="shead l"><span class="eyebrow">For clients</span><h2>Pay only for work you approve.</h2><p>Funds sit in escrow until you release them, one milestone at a time.</p></div>${bullets(['Pay only for approved work', 'Funds stay locked until you release', 'Cancel and refund what isn’t paid yet'])}<div>${cw()}</div></div><div class="ppanel"><img src="${IMG['phone-client']}" alt="MileVault on iPhone: approving Core functionality"></div></section>
    <section class="split rev" id="contributors"><div class="ppanel"><img src="${IMG['phone-contrib']}" alt="MileVault on iPhone: a funded agreement for the contributor"></div><div class="tx"><div class="shead l"><span class="eyebrow">For contributors</span><h2>See the money before you start.</h2><p>The USDC is locked in the contract before you begin, so every milestone is already funded.</p></div>${bullets(['See the money is there before you start', 'Submit each milestone with your work', 'Get paid straight to your wallet'])}<div>${cw()}</div></div></section>
    <section id="security"><div class="shead" style="width:${m ? 'auto' : '900px'}"><span class="eyebrow">Security</span><h2>Your keys. Your funds. On-chain.</h2><p>MileVault is a window onto a Soroban contract. It can’t move money for you.</p></div>
      <div class="steps5"><div class="r">${feat('safe_lock', 'Funds are held by a Soroban contract', 'The contract holds the USDC and only pays out when the client releases a milestone.')}${feat('lock', 'MileVault never holds your keys', 'Every action is signed in your own wallet. We can’t move funds for you.')}${feat('link', 'Every movement has a hash', 'Create, fund, release and refund all link to the Stellar explorer.')}</div></div></section>
    <section class="notice"><img src="${IMG['BG-cta']}" alt=""><div class="scrim"></div><span class="eyebrow">This is Stellar Testnet</span><h2>Try it with test USDC.</h2><p>Amounts are test USDC with no real value. Get free test funds from the Stellar faucet before you fund an agreement.</p><div class="ctas">${cw()}<button class="lbtn l o" data-a="faucet">Open faucet</button></div></section>
  </div>
  <footer class="lfoot"><div class="t"><div class="brand"><div class="logo"><span class="mk">${ic('safe_lock', 16)}</span>MileVault</div>Milestone escrow for contributors and clients, on Stellar.</div>
    <div class="cols"><div><b>Product</b><span data-a="scrollTo" data-v="how">How it works</span><span data-a="scrollTo" data-v="clients">For clients</span><span data-a="scrollTo" data-v="contributors">For contributors</span><span data-a="scrollTo" data-v="security">Security</span></div><div><b>Developers</b><span>Soroban contract</span><span>Stellar explorer</span><span data-a="faucet">Testnet faucet</span></div><div><b>Legal</b><span>Privacy</span><span>Terms</span></div></div></div>
    <div class="b"><span>© 2026 MileVault</span><span>Running on Stellar Testnet · test USDC only</span></div></footer></div>`;
}
function sidebarStatic() { const r = S.route; S.route = { name: 'dashboard' }; const h = sidebar(); S.route = r; return h; }

function balanceCard() {
  const hid = v => S.hideBal ? '••••••' : v;
  const mine = S.agreements.filter(a => (IS_CLIENT ? a.client : a.contributor) === ME_KEY);
  const sum = f => mine.flatMap(a => a.ms.filter(f)).reduce((s, m) => s + m.amount, 0);
  const m = S.view === 'm';
  let amount, sub, stats, acts, macts;
  if (IS_CLIENT) {
    const act = mine.filter(a => a.status === 'funded');
    amount = mine.reduce((s, a) => s + locked(a), 0);
    sub = `Funds in escrow across ${plural(act.length, 'active agreement')}`;
    stats = [['Awaiting approval', C.amber, sum(x => x.status === 'submitted')], ['Released to contributors', C.green, sum(x => x.status === 'paid')], ['Total spent', '#D9D9D9', mine.filter(isFunded).reduce((s, a) => s + total(a), 0)]];
    acts = [['fund', 'safe_lock', 'Fund escrow', 'Fund escrow'], ['newAg', 'add', 'New agreement', 'New'], ['releaseAny', 'transfer', 'Release payment', 'Release']];
  } else {
    amount = sum(x => x.status === 'paid');
    sub = 'Paid to your wallet so far';
    stats = [['Awaiting approval', C.amber, sum(x => x.status === 'submitted')], ['Approved, not paid', C.green, sum(x => x.status === 'approved')], ['Still to earn', '#D9D9D9', mine.filter(a => a.status === 'funded').reduce((s, a) => s + locked(a), 0)]];
    acts = [['submitAny', 'send', 'Submit milestone', 'Submit'], ['nav', 'file', 'Agreements', 'Agreements', 'agreements'], ['copy', 'copy', 'Copy address', 'Copy', ME.addr]];
  }
  const head = `${patternSvg}<div><div class="amt"><b>${hid(usd(amount))}</b><span class="eyebox" data-a="hideBal" title="${S.hideBal ? 'Show' : 'Hide'} balance">${ic(S.hideBal ? 'eye' : 'eye_close', 16)}</span></div><div class="sub">${sub}</div></div>`;
  if (m) return `<div class="card bal">${head}
    <div class="macts">${acts.map(x => `<button data-a="${x[0]}"${x[4] ? ` data-v="${x[4]}"` : ''}><span class="c">${ic(x[1], 20)}</span>${x[3]}</button>`).join('')}<button data-a="menu" data-v="dash"><span class="c">${ic('more', 20)}</span>More</button></div><div class="div"></div>
    <div class="mstats">${stats.map(s => `<div><span class="k"><i style="background:${s[1]}"></i>${s[0]}${ic('info', 14)}</span><b>${hid(usd(s[2]))}</b></div>`).join('')}</div></div>`;
  return `<div class="card bal">${head}
    <div class="acts">${IS_CLIENT ? acts.map(x => `<button class="btn tint" data-a="${x[0]}"${x[4] ? ` data-v="${x[4]}"` : ''}>${ic(x[1], 18)}<span>${x[2]}</span></button>`).join('') + `<button class="btn tint more" data-a="menu" data-v="dash" aria-label="More">${ic('more', 18)}</button>`
      : acts.slice(0, 2).map(x => `<button class="btn tint" data-a="${x[0]}"${x[4] ? ` data-v="${x[4]}"` : ''}><span>${x[2]}</span></button>`).join('') + `<button class="btn tint more" data-a="copy" data-v="${ME.addr}" aria-label="Copy address" title="Copy address">${ic('copy_line', 18)}</button>`}</div>
    <div class="div"></div><div class="legend">${stats.map(s => `<div class="stat"><div class="k"><span><i style="background:${s[1]}"></i>${s[0]}</span>${ic('info', 14)}</div><b>${hid(usd(s[2]))}</b></div>`).join('')}</div></div>`;
}

function cardLine(a) {
  const n = a.ms.length, p = paidN(a), st = agState(a);
  const sub = a.ms.find(m => m.status === 'submitted'), apr = a.ms.find(m => m.status === 'approved');
  if (st === 'awaiting') return [IS_CLIENT ? 'Awaiting funding' : 'Not funded yet', C.amber, .25];
  if (st === 'awaitc') return [IS_CLIENT ? 'Awaiting contributor' : 'Review the terms', C.blue, .25];
  if (st === 'completed') return [`${n} of ${n} paid`, C.green, 1];
  if (st === 'cancelled' || st === 'declined') return [BADGE[st][0], C.soft, 1];
  if (IS_CLIENT && sub) return ['1 to approve', C.amber, (p + .5) / n];
  if (IS_CLIENT && apr) return ['1 to release', C.amber, (p + .5) / n];
  if (!IS_CLIENT && apr) return ['Approved · not paid', C.blue, .75];
  if (!IS_CLIENT && !p && !sub) return ['Funded', C.blue, .75];
  return [`${p} of ${n} paid`, C.green, Math.max(p / n, .12)];
}
function projectCard(a) {
  const [t, c, f] = cardLine(a);
  return `<div class="card pcard" data-a="open" data-v="${a.id}">${folder(a.color, 56)}<div class="tx"><b>${esc(a.name)}</b><small style="color:${c}">${ring(f, c)}${t}</small></div></div>`;
}
function waitingRows() {
  const rows = [];
  for (const a of S.agreements) {
    if (['cancelled', 'declined', 'completed'].includes(a.status)) continue;
    const n = a.ms.length;
    if (IS_CLIENT) {
      if (a.client !== ME_KEY) continue;
      if (a.status === 'created') rows.push({ a, title: a.name, meta: `1 of ${n}`, amt: total(a), b: 'awaiting', btn: ['Fund', 'fund', a.id] });
      a.ms.forEach((m, i) => {
        if (m.status === 'submitted') rows.push({ a, title: m.title, meta: `${i + 1} of ${n}`, amt: m.amount, b: 'submitted', btn: ['Approve', 'approve', a.id, i] });
        if (m.status === 'approved') rows.push({ a, title: m.title, meta: `${i + 1} of ${n}`, amt: m.amount, b: 'approved', btn: ['Release', 'release', a.id, i] });
      });
    } else {
      if (a.contributor !== ME_KEY) continue;
      if (a.status === 'funded' && !a.accepted) rows.push({ a, title: 'Review the terms', meta: `0 of ${n}`, amt: total(a), b: 'awaitc', btn: ['Review', 'open', a.id] });
      else if (a.status === 'funded') { const i = curIdx(a); const m = a.ms[i]; if (m && m.status === 'pending') rows.push({ a, title: m.title, meta: `${i + 1} of ${n}`, amt: m.amount, b: 'progress', btn: ['Submit', 'submit', a.id, i] }); }
    }
  }
  return rows;
}
function waitingHtml(rows) {
  const m = S.view === 'm';
  return `<div class="card rows wait">${rows.map(r => `<div class="row click" data-a="open" data-v="${r.a.id}">${folder(r.a.color, 50.909)}<div class="tx"><b>${esc(r.title)}</b><div class="meta"><span>${ic('folder_open', 16)}<em>${esc(r.a.name)}</em></span><i></i><span>${ic('flag', 16)}${r.meta}</span></div></div>
    ${m ? `<div class="rr"><span class="amt">${usd(r.amt)}</span>${badge(r.b, true)}</div><button class="btn sec h28" data-a="${r.btn[1]}" data-v="${r.btn[2]}"${r.btn[3] !== undefined ? ` data-w="${r.btn[3]}"` : ''}><span>${r.btn[0]}</span></button>`
      : `<span class="amt">${usd(r.amt)}</span>${badge(r.b)}<button class="btn sec h28" data-a="${r.btn[1]}" data-v="${r.btn[2]}"${r.btn[3] !== undefined ? ` data-w="${r.btn[3]}"` : ''}><span>${r.btn[0]}</span></button>`}</div>`).join('')}</div>`;
}
const TXT = {
  release: [IS_CLIENT ? 'Release' : 'Payment received', 'transfer', C.green, '#EBFEF3'], fund: ['Fund escrow', 'safe_lock', C.pri, '#EAF8FE'], approve: ['Approve milestone', 'check_circle', C.blue, '#ECF4FE'], create: ['Create agreement', 'file_new', C.pri, '#EAF8FE'],
  submit: ['Submit milestone', 'flag', C.amber, '#FEFCE6'], accept: ['Accept agreement', 'check_circle', C.blue, '#ECF4FE'], cancel: ['Cancel agreement', 'close_circle', C.sub, '#F5F5F5'], refund: ['Refund', 'refresh', '#B36BF2', '#FAF3FE'],
};
const ACT = {
  release: ['bill', C.green, '#EBFEF3'], receive: ['bill', C.green, '#EBFEF3'], fund: ['safe_lock', C.pri, '#EAF8FE'], submit: ['flag', C.amber, '#FEFCE6'], approve: ['check_circle', C.blue, '#ECF4FE'],
  create: ['file_new', '#B36BF2', '#FAF3FE'], accept: ['check_circle', C.blue, '#ECF4FE'], cancel: ['close_circle', C.sub, '#F5F5F5'], refund: ['refresh', '#B36BF2', '#FAF3FE'],
};
function activityHtml(items, noAg) {
  if (!items.length) return `<div class="card empty">${ill('E-03')}<b>No activity yet</b><p>Funding, approvals and payments show up here with their Stellar transaction.</p></div>`;
  return `<div class="card rows act">${items.map(x => { const [i, c, b] = ACT[x.k] || ACT.create; const sub = noAg ? x.sub.replace(/^[^·]+· /, '') : x.sub;
    return `<div class="row"><span class="tile" style="width:36px;height:36px;background:${b}">${ic(i, 18, c)}</span><div class="tx"><b>${esc(x.title)}</b><small>${esc(sub)}${x.hash ? ` · ${x.when}` : ''}</small></div>${x.hash ? `<span class="hash" data-a="explorer" data-v="${x.hash}">${x.hash}${ic('external', 14)}</span>` : `<span class="when">${x.when}</span>`}</div>`; }).join('')}</div>`;
}
const sh = (t, a, v, l = 'See all') => `<div class="sh"><h3>${t}</h3>${a ? `<span class="link" data-a="${a}"${v ? ` data-v="${v}"` : ''}>${l}</span>` : ''}</div>`;

function dashboard(stat) {
  const mine = S.agreements.filter(a => (IS_CLIENT ? a.client : a.contributor) === ME_KEY);
  const active = mine.filter(a => a.status === 'funded' || (IS_CLIENT && a.status === 'created'));
  const order = a => (a.id === WR ? 0 : 1) + (a.status === 'created' ? 2 : 0);
  const cards = [...active].sort((x, y) => order(x) - order(y)).slice(0, 3);
  const rows = waitingRows();
  const first = !mine.length;
  return `<div class="pt">Dashboard</div>${balanceCard()}
  ${sh('Active agreements', 'nav', 'agreements')}<div class="agrid">${cards.map(projectCard).join('')}</div>
  ${sh(IS_CLIENT ? 'Milestones waiting on you' : 'Milestones waiting on you', rows.length ? 'nav' : '', 'agreements')}
  ${rows.length ? waitingHtml(rows) : `<div class="card empty">${ill('E-03')}<b>All caught up</b><p>${IS_CLIENT ? 'Nothing to fund, approve or release right now.' : 'Nothing to submit right now. We’ll show it here when there is.'}</p></div>`}
  ${sh('Recent activity', 'nav', 'transactions')}${activityHtml(S.activity.slice(0, 3))}`;
}

function agreementsPage() {
  const f = S.listTag; const q = S.search.trim().toLowerCase();
  const mine = S.agreements;
  const needs = a => IS_CLIENT ? (a.client === ME_KEY && (a.status === 'created' || a.ms.some(m => m.status === 'submitted' || m.status === 'approved'))) : (a.contributor === ME_KEY && a.status === 'funded' && (!a.accepted || a.ms[curIdx(a)]?.status === 'pending'));
  const tags = [['all', 'All', () => true], ['client', 'As client', a => a.client === ME_KEY], ['contrib', 'As contributor', a => a.contributor === ME_KEY], ['needs', 'Needs you', needs], ['done', 'Completed', a => a.status === 'completed']];
  const fn = tags.find(t => t[0] === f)[2];
  const items = mine.filter(fn).filter(a => !q || a.name.toLowerCase().includes(q) || other(a).name.toLowerCase().includes(q));
  const prog = a => `<div class="prog">${a.ms.map(m => `<i class="${m.status === 'paid' ? 'g' : m.status === 'submitted' ? 'y' : m.status === 'approved' ? 'b' : ''}"></i>`).join('')}</div>`;
  const metaLine = a => { const st = agState(a); const p = paidN(a); const n = a.ms.length; const role = a.client === ME_KEY ? 'As client' : 'As contributor';
    let s = `${p} of ${n} paid`; if (st === 'awaitc') s = IS_CLIENT ? 'waiting to accept' : 'review the terms'; if (st === 'awaiting') s = 'not funded yet';
    if (IS_CLIENT && a.ms.some(m => m.status === 'submitted')) s = '1 to approve'; if (IS_CLIENT && a.ms.some(m => m.status === 'approved') && !a.ms.some(m => m.status === 'submitted')) s = '1 to release';
    return `${other(a).name} · ${role} · ${s}`; };
  const esc2 = a => a.status === 'completed' ? 'Paid in full' : `${fmt(locked(a))} in escrow`;
  const m = S.view === 'm';
  return `<div class="phead"><div class="pt" style="padding:0">Agreements</div>${IS_CLIENT ? `<button class="btn pri h32" data-a="newAg">${ic('add', 18)}<span>New agreement</span></button>` : ''}</div>
  <div class="toolbar"><label class="search">${ic('search', 16)}<input data-f="search" value="${esc(S.search)}" placeholder="Search by name or address"><span class="kbd">⌘K</span></label><span class="dd"><span>Most recent</span>${ic('down', 18)}</span></div>
  <div class="filters">${tags.map(t => `<button class="tag ${f === t[0] ? 'on' : ''}" data-a="listTag" data-v="${t[0]}"><b>${t[1]}</b><small>${mine.filter(t[2]).length}</small></button>`).join('')}</div>
  ${items.length ? `<div class="card rows agl">${items.map(a => `<div class="row click" data-a="open" data-v="${a.id}">${folder(a.color, 50.909)}<div class="tx"><b>${esc(a.name)}</b><small>${esc(metaLine(a))}</small>${prog(a)}</div>
    ${m ? `<div class="rc"><div class="amt">${usd(total(a))}<small>${esc2(a)}</small></div>${badge(agState(a))}</div>` : `<div class="amt">${usd(total(a))}<small>${esc2(a)}</small></div><div class="bcol" style="width:150px">${badge(agState(a))}</div>`}</div>`).join('')}</div>`
    : `<div class="card empty">${ill('E-03')}<b>No agreements match</b><p>Try another filter or search term.</p></div>`}`;
}

function nextAction(a) {
  const o = other(a); const i = curIdx(a); const m = a.ms[i];
  const box = (k, t, p, acts = '') => `<div class="card next"><div class="top">${ill(k)}<div class="tx"><b>${t}</b><p>${p}</p></div></div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
  const B = (cls, a2, v, w, label, icon) => `<button class="btn ${cls} h40" data-a="${a2}"${v !== undefined ? ` data-v="${v}"` : ''}${w !== undefined ? ` data-w="${w}"` : ''}>${icon ? ic(icon, 18) : ''}<span>${label}</span></button>`;
  if (a.status === 'cancelled') return box('C-02', 'This agreement was cancelled', 'It was never funded, so there was nothing to refund.');
  if (a.status === 'declined') return box('C-06', IS_CLIENT ? `${o.first} declined this agreement` : 'You declined this agreement', `The ${usd(total(a))} went back to ${IS_CLIENT ? 'your wallet' : PEOPLE[a.client].name}.`);
  if (a.status === 'completed') return box(IS_CLIENT ? 'M-10' : 'M-07', IS_CLIENT ? 'All milestones paid' : 'Paid in full', IS_CLIENT ? `You released ${usd(total(a))} to ${o.name} across ${plural(a.ms.length, 'milestone')}. The escrow is empty.` : `You received ${usd(total(a))} from ${o.name}. Every payment links to its Stellar transaction.`, B('sec', 'tab', 'activity', undefined, 'View payment history'));
  if (IS_CLIENT) {
    if (a.status === 'created') return box('F-04', `Fund escrow to start`, `${o.name} won’t start until the ${usd(total(a))} is locked in the contract.`, B('pri', 'fund', a.id, undefined, `Fund ${usd(total(a))}`) + B('sec', 'copy', `https://milevault.app/a/${a.id}`, undefined, 'Copy agreement link'));
    if (!a.accepted) return box('F-02', `Waiting for ${o.first} to accept`, `The escrow is funded. ${o.first} reviews the terms and accepts before starting milestone 1.`, B('sec', 'copy', `https://milevault.app/a/${a.id}`, undefined, 'Copy agreement link'));
    if (m.status === 'submitted') return box('M-02', `Review ${esc(m.title)}`, `Submitted ${m.when.toLowerCase()} with ${esc(m.link)}. Approving doesn’t pay yet; you release the ${usd(m.amount)} next.`, B('pri', 'approve', a.id, i, 'Approve milestone') + B('sec', 'openLink', a.id, i, 'Open submitted link'));
    if (m.status === 'approved') return box('M-04', `Release ${usd(m.amount)} for ${esc(m.title)}`, `You approved it, but ${o.first} isn’t paid yet. Releasing sends the money from escrow to their wallet.`, B('pri', 'release', a.id, i, 'Release payment'));
    return box('F-02', `Waiting on ${o.first} for ${esc(m.title)}`, `Funds are locked. We’ll let you know when ${o.first} submits milestone ${i + 1}.`);
  }
  if (a.status === 'created') return box('F-04', 'Not funded yet. Don’t start work.', `${o.name} created this agreement but hasn’t locked any money in escrow. You’ll see it here as soon as they do.`);
  if (!a.accepted) return box('O-02', 'Review the terms', `${o.first} locked ${usd(total(a))} in escrow for ${plural(a.ms.length, 'milestone')}. Accept to start, or decline if the terms don’t work for you.`, B('pri', 'accept', a.id, undefined, 'Accept agreement') + B('sec', 'decline', a.id, undefined, 'Decline'));
  if (m.status === 'pending') return box('M-01', `Ready to submit ${esc(m.title)}`, `When the work is done, submit a link so ${o.first} can review it. ${usd(m.amount)} is waiting in escrow for this milestone.`, B('pri', 'submit', a.id, i, 'Submit milestone'));
  if (m.status === 'submitted') return box('M-02', `Waiting for ${o.first} to review`, `You submitted ${esc(m.title)} ${m.when.toLowerCase()}. Nothing to do until ${o.first} approves it.`);
  return box('M-04', 'Approved, not paid yet', `${o.first} approved ${esc(m.title)}. The ${usd(m.amount)} reaches your wallet when they release it.`);
}
function msRows(a, withActions = true) {
  const ci = curIdx(a);
  return `<div class="card rows ms">${a.ms.map((m, i) => {
    let sub = m.desc || '';
    if (m.status === 'paid') sub = `Released ${m.when ? m.when.toLowerCase() : ''}`;
    else if (m.status === 'submitted') sub = `Submitted ${m.when.toLowerCase()} · ${m.link}`;
    else if (m.status === 'approved') sub = 'Approved, waiting for release';
    else if (isFunded(a) && a.accepted && i > ci) sub = `Starts after milestone ${i}`;
    else if (isFunded(a) && a.accepted && i === ci) sub = IS_CLIENT ? 'In progress' : 'Ready for you';
    let btn = '';
    if (withActions && IS_CLIENT && m.status === 'submitted') btn = `<button class="btn pri h28" data-a="approve" data-v="${a.id}" data-w="${i}"><span>Approve</span></button>`;
    if (withActions && IS_CLIENT && m.status === 'approved') btn = `<button class="btn pri h28" data-a="release" data-v="${a.id}" data-w="${i}"><span>Release</span></button>`;
    if (withActions && !IS_CLIENT && a.status === 'funded' && a.accepted && i === ci && m.status === 'pending') btn = `<button class="btn pri h28" data-a="submit" data-v="${a.id}" data-w="${i}"><span>Submit</span></button>`;
    const mob = S.view === 'm';
    if (mob) return `<div class="row mrow"><span class="seq">${i + 1}</span><div class="tx"><b>${esc(m.title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}<div class="ab"><span class="amt">${usd(m.amount)}</span>${badge(m.status)}</div>${btn}</div></div>`;
    return `<div class="row"><span class="seq">${i + 1}</span><div class="tx"><b>${esc(m.title)}</b><small>${esc(sub) || '&nbsp;'}</small></div><span class="amt">${usd(m.amount)}</span><div class="bcol"${mob ? '' : ' style="width:110px"'}>${badge(m.status, mob)}</div>${btn && !mob ? btn : ''}</div>`;
  }).join('')}</div>`;
}
function agreementPage() {
  const a = ag(S.route.id);
  if (!a) return `<div class="card empty">${ill('E-03')}<b>Agreement not found</b></div>`;
  const c = PEOPLE[a.client], k = PEOPLE[a.contributor];
  const st = agState(a);
  const acts = S.activity.filter(x => x.sub?.startsWith(a.name) || x.title.includes(a.name));
  const party = (role, p, me) => `<div class="party">${av(p, 40)}<div class="tx"><small>${role}</small><b>${p.name}${me ? ' (you)' : ''}</b></div><span class="chip" data-a="copy" data-v="${p.addr}">${p.short}${ic('copy', 14)}</span></div>`;
  const seg = a.ms.map(m => `<i class="${m.status === 'paid' ? 'g' : m.status === 'approved' ? 'b' : m.status === 'submitted' ? 'y' : ''}"></i>`).join('');
  const t = (x, l) => `<button class="${S.tab === x ? 'on' : ''}" data-a="tab" data-v="${x}">${l}</button>`;
  let body = '';
  if (S.tab === 'overview') body = `${sh('Milestones', 'tab', 'milestones', 'View all')}${msRows(a)}${sh('Recent activity', 'tab', 'activity', 'View all')}${activityHtml(acts.slice(0, 3), true)}`;
  if (S.tab === 'milestones') body = `${msRows(a)}<div class="card" style="padding:4px 16px"><div class="rcpt" style="padding:0">${a.ms.map((m, i) => `<div><span>${i + 1}. ${esc(m.title)}</span><b>${usd(m.amount)}</b></div>`).join('')}<div><span>Total</span><b>${usd(total(a))}</b></div></div></div>`;
  if (S.tab === 'activity') body = activityHtml(acts, true);
  const youRole = a.client === ME_KEY ? 'client' : 'contributor';
  return `<span class="back" data-a="nav" data-v="agreements">${ic('left', 16)}Agreements</span>
  <div class="ahead"><div class="tr"><span class="pt" style="padding:0">${esc(a.name)}</span>${badge(st)}<span class="more"><button class="btn sec h32" style="width:32px;padding:0" data-a="menu" data-v="ag" aria-label="More">${ic('more', 18)}</button></span></div><p>You’re the ${youRole} · created ${a.created}</p></div>
  <div class="card">${party('Client', c, a.client === ME_KEY)}${party('Contributor', k, a.contributor === ME_KEY)}
    <div class="party"><span class="tile" style="width:40px;height:40px;background:#ECF4FE">${ic('file', 20, C.blue)}</span><div class="tx"><small>Agreement ID</small><b>Escrow contract</b></div><div class="rt"><span class="chip" data-a="copy" data-v="CDLZ…E2M">C…E2M${ic('copy', 14)}</span><span class="link" data-a="explorer" data-v="C…E2M"><span class="lt">Explorer</span>${ic('external', 16)}</span></div></div></div>
  <div class="card fund"><b>Funding</b><div class="figs"><div><small>Escrow total</small><b>${usd(total(a))}</b></div><div><small>Released</small><b style="color:${C.green}">${usd(released(a))}</b></div><div><small>${IS_CLIENT ? 'Locked in escrow' : 'Locked for you'}</small><b>${usd(locked(a))}</b></div></div><div class="prog full">${seg}</div>
    ${a.status === 'created' && IS_CLIENT ? `<div class="hint">${ic('info', 16)}Fund the full ${usd(total(a))} to start. You have ${fmt(S.bal)} test USDC.</div>` : ''}</div>
  ${nextAction(a)}
  <div class="tabs">${t('overview', 'Overview')}${t('milestones', 'Milestones')}${t('activity', 'Activity')}</div>${body}`;
}

function newAgreement() {
  const d = S.draft; const e = S.errors; const m = S.view === 'm';
  const stp = (n, l) => `<div class="stp ${d.step === n ? 'cur' : d.step > n ? 'done' : 'fut'}"${d.step > n ? ` data-a="step" data-v="${n}"` : ''}><span class="d">${d.step > n ? ic('check', 14) : n}</span><span class="lb">${l}</span></div>`;
  const tot = d.ms.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const hint = (k, t) => e[k] ? `<div class="hint err">${ic('warning', 16)}${e[k]}</div>` : t ? `<div class="hint">${ic('info', 16)}${t}</div>` : '';
  const lbl = (t, req) => `<label class="lbl">${t}${req ? '<span class="req">*</span>' : '<span class="opt">(Optional)</span>'}</label>`;
  const anyFilled = d.name || d.addr || d.ms.some(x => x.title);
  let body = '';
  if (d.step === 1) body = `<div class="card form">
    <div class="fld">${lbl('Project name', 1)}<div class="inp ${e.name ? 'err' : ''}"><input data-f="name" value="${esc(d.name)}" placeholder="e.g. Website redesign" maxlength="60"></div>${hint('name', 'Up to 60 characters')}</div>
    <div class="fld">${lbl('Description')}<div class="inp ta"><textarea data-f="desc" maxlength="500" placeholder="What is this agreement for?">${esc(d.desc)}</textarea><span class="cnt" id="cnt-desc">${d.desc.length}/500</span></div>${hint('desc', 'Shown to your contributor')}</div>
    <div class="fld">${lbl('Contributor’s Stellar address', 1)}<div class="inp ${e.addr ? 'err' : ''}"><input data-f="addr" value="${esc(d.addr)}" placeholder="G…" spellcheck="false"><span class="link" style="font-size:13px" data-a="paste">Paste</span></div>${hint('addr', 'Starts with G. Paste it from their wallet.')}</div></div>
    <div class="factions"><span class="mlink" data-a="fillExample">${anyFilled ? 'Save draft' : 'Fill with example'}</span><span class="sp"></span><button class="btn ghost h44" data-a="nav" data-v="dashboard"><span>Cancel</span></button><button class="btn pri h44" data-a="step" data-v="2"><span>Continue</span>${ic('right', 18)}</button></div>`;
  if (d.step === 2) body = `${d.ms.map((x, i) => `<div class="card mse"><div class="tp">${ic('menu', 16)}Milestone ${i + 1}<span class="acts"><button class="rm del" data-a="delMs" data-v="${i}" title="Remove milestone">${ic('delete', 18)}</button><button class="rm" data-a="dupMs" data-v="${i}" title="Duplicate milestone">${ic('copy_line', 18)}</button></span></div>
      <div class="fld">${lbl('Title', 1)}<div class="inp ${e[`ms.${i}.title`] ? 'err' : ''}"><input data-f="ms.${i}.title" value="${esc(x.title)}" placeholder="e.g. Wireframes" maxlength="60"></div>${hint(`ms.${i}.title`, 'Up to 60 characters')}</div>
      <div class="fld">${lbl('Description')}<div class="inp ta"><textarea data-f="ms.${i}.desc" maxlength="500" placeholder="What does done look like?">${esc(x.desc)}</textarea><span class="cnt" id="cnt-ms.${i}.desc">${x.desc.length}/500</span></div>${hint('', 'Shown to your contributor')}</div>
      <div class="fld amtin">${lbl('Amount', 1)}<div class="inp ${e[`ms.${i}.amount`] ? 'err' : ''}"><div class="a"><span>$</span><input data-f="ms.${i}.amount" value="${esc(x.amount)}" placeholder="0.00" inputmode="decimal"></div><span class="vr"></span><span class="sx">${ic('usdc', 16, '#2775CA')}USDC</span></div>${hint(`ms.${i}.amount`, 'Paid when you release it')}</div></div>`).join('')}
    ${d.ms.length < 10 ? `<button class="btn sec h40" data-a="addMs" style="width:100%">${ic('add', 18)}<span>Add milestone</span></button>` : `<div class="hint" style="padding:0 8px">${ic('info', 16)}That’s the 10 milestone limit</div>`}
    <div class="card total"><div class="tr"><div><small>Agreement total</small><b id="tot">${usd(tot)}</b></div><small id="totn">${plural(d.ms.length, 'milestone')}</small></div><div class="nt">${ic('info', 16)}<span id="totnote">You’ll fund the full ${usd(tot)} in one step after creating.</span></div></div>
    <div class="factions"><span class="mlink" data-a="${d.ms.some(x => x.title) ? 'noop' : 'fillExample'}">${d.ms.some(x => x.title) ? 'Save draft' : 'Fill with example'}</span><span class="sp"></span><button class="btn sec h44" data-a="step" data-v="1"><span>Back</span></button><button class="btn pri h44" data-a="step" data-v="3"><span>Continue</span>${ic('right', 18)}</button></div>`;
  if (d.step === 3) {
    const kp = Object.values(PEOPLE).find(p => p.addr === d.addr.trim()) || { name: 'Contributor', short: `${d.addr.slice(0, 1)}…${d.addr.slice(-3)}`, addr: d.addr, bg: '#F5F5F5', fg: C.sub };
    body = `<div class="card pv"><div><h4>${esc(d.name)}</h4><p>${esc(d.desc) || 'No description'}</p></div>
      <div class="card sub-card"><div class="party">${av(ME, 40)}<div class="tx"><small>Client</small><b>${ME.name} (you)</b></div><span class="chip">${ME.short}${ic('copy', 14)}</span></div><div class="party">${av(kp, 40)}<div class="tx"><small>Contributor</small><b>${kp.name}</b></div><span class="chip">${kp.short}${ic('copy', 14)}</span></div></div>
      <div class="card sub-card rows ms">${d.ms.map((x, i) => m ? `<div class="row mrow"><span class="seq">${i + 1}</span><div class="tx"><b>${esc(x.title)}</b><small>${esc(x.desc) || 'No description'}</small><div class="ab"><span class="amt">${usd(parseFloat(x.amount))}</span><span class="badge" data-a="step" data-v="2" style="cursor:pointer">${ic('edit', 16, C.soft)}Draft</span></div></div></div>` : `<div class="row"><span class="seq">${i + 1}</span><div class="tx"><b>${esc(x.title)}</b><small>${esc(x.desc) || 'No description'}</small></div><span class="amt">${usd(parseFloat(x.amount))}</span><div class="bcol"${m ? '' : ' style="width:110px"'}><span class="badge" data-a="step" data-v="2" style="cursor:pointer">${ic('edit', 16, C.soft)}${m ? '' : 'Draft'}</span></div></div>`).join('')}</div>
      <div class="kvs"><div><span>Agreement total</span><b>${usd(tot)}</b></div><div><span>Network</span><b>Stellar Testnet</b></div><div><span>Network fee</span><b>≈ 0.00001 XLM</b></div></div>
      <div class="pvnote">${ic('info', 16)}Creating only records the agreement on-chain. No USDC moves until you fund escrow in the next step.</div></div>
      <div class="factions"><span class="mlink" data-a="noop">Save draft</span><span class="sp"></span><button class="btn sec h44" data-a="step" data-v="2"><span>Back</span></button><button class="btn pri h44" data-a="createConfirm"><span>Create agreement</span></button></div>`;
  }
  return `<span class="back" data-a="nav" data-v="agreements">${ic('left', 16)}Agreements</span>
  <div class="titlerow"><span class="pt" style="padding:0">New agreement</span>${anyFilled ? '<small>Draft saved just now</small>' : ''}</div>
  <div class="stepper">${stp(1, 'Project')}<div class="conn ${d.step > 1 ? 'done' : ''}"></div>${stp(2, 'Milestones')}<div class="conn ${d.step > 2 ? 'done' : ''}"></div>${stp(3, 'Preview')}</div>${body}`;
}

function createdPage() {
  const a = ag(S.route.id); const k = PEOPLE[a.contributor];
  return `<div class="created">${slot('A-01')}<h2>Agreement created</h2><p class="c">${esc(a.name)} is recorded on Stellar Testnet. Fund the escrow so ${k.first} can see the money is there and start.</p>
    <div class="card rcpt"><div><span>Create transaction</span><span class="txh" data-a="explorer" data-v="${a.createHash}">${a.createHash}${ic('external', 14)}</span></div><div><span>Status</span>${badge('awaiting')}</div><div><span>Total</span><b>${usd(total(a))}</b></div></div>
    <div class="card next" style="width:100%"><div class="top">${ill('F-01')}<div class="tx"><b>Next: fund escrow</b><p>Lock ${usd(total(a))} in the contract. ${k.first} can’t start until it’s funded.</p></div></div><div class="acts"><button class="btn pri h40" data-a="fund" data-v="${a.id}"><span>Fund escrow</span></button><button class="btn sec h40" data-a="copy" data-v="https://milevault.app/a/${a.id}"><span>Copy agreement link</span></button></div></div>
    <div class="clinks"><span class="link" data-a="open" data-v="${a.id}">Go to agreement</span><span class="mlink" data-a="nav" data-v="dashboard">Back to dashboard</span></div></div>`;
}

function txPage() {
  const f = S.txTag;
  const all = S.activity.filter(x => x.hash);
  const kind = x => x.k === 'fund' ? 'fund' : x.k === 'release' ? 'rel' : x.k === 'refund' ? 'ref' : 'oth';
  const tags = [['all', 'All'], ['fund', 'Funding'], ['rel', IS_CLIENT ? 'Releases' : 'Payments'], ['ref', 'Refunds'], ['oth', 'Other']];
  const items = all.filter(x => f === 'all' || kind(x) === f);
  const groups = ['Today', 'This week', 'Earlier'].map(g => [g, items.filter(x => (x.group || 'Earlier') === g)]).filter(g => g[1].length);
  const m = S.view === 'm';
  return `<div class="phead"><div class="pt" style="padding:0">Transactions</div><button class="btn sec h32" data-a="noop">${ic('file', 18)}<span>Export CSV</span></button></div>
  <div class="toolbar"><label class="search">${ic('search', 16)}<input placeholder="Search by name or address"><span class="kbd">⌘K</span></label><span class="dd"><span>All statuses</span>${ic('down', 18)}</span></div>
  <div class="filters">${tags.map(t => `<button class="tag ${f === t[0] ? 'on' : ''}" data-a="txTag" data-v="${t[0]}"><b>${t[1]}</b><small>${t[0] === 'all' ? all.length : all.filter(x => kind(x) === t[0]).length}</small></button>`).join('')}</div>
  ${groups.length ? groups.map(([g, list]) => `<div class="tgroup">${g}</div><div class="card rows tx">${list.map(x => { const [lab, i, c, b] = TXT[x.k] || TXT.create;
    const amt = x.amount ? `${x.inc || x.k === 'refund' ? '+' : IS_CLIENT ? '−' : ''}${usd(x.amount)}` : '—';
    return `<div class="row"><span class="typ" style="background:${b}">${ic(i, 18, c)}</span><div class="tx"><b>${lab}</b><small>${esc(x.tsub || x.sub)}</small></div>${m ? `<div class="rc"><span class="amt">${amt}</span>${badge('confirmed')}</div></div>` : `<span class="amt">${amt}</span><div class="bcol">${badge('confirmed')}</div><span class="when">${x.when}</span><span class="txh" data-a="explorer" data-v="${x.hash}">${x.hash}${ic('external', 14)}</span></div>`}`; }).join('')}</div>`).join('')
    : `<div class="card empty">${ill('E-03')}<b>No transactions here</b><p>Try another filter.</p></div>`}`;
}

function walletsPage() {
  const lk = S.agreements.filter(a => a.client === ME_KEY).reduce((s, a) => s + locked(a), 0);
  const wait = S.agreements.filter(a => a.contributor === ME_KEY && a.status === 'funded').reduce((s, a) => s + locked(a), 0);
  const used = S.agreements.filter(a => a.client === ME_KEY || a.contributor === ME_KEY).length;
  const bal = (icn, col, name, sub, val, note) => `<div class="row"><span class="btile">${ic(icn, 20, col)}</span><div class="tx"><b>${name}</b><small>${sub}</small></div><div class="bv"><b>${val}</b><small>${note}</small></div></div>`;
  return `<div class="pt">Wallets</div>
  <div class="card wcard"><div class="wtop"><span class="wlogo">F</span><div class="tx"><div class="n">Freighter${badge('connected')}</div><div class="a" data-a="copy" data-v="${ME.addr}">${S.view === 'm' ? ME.addr.slice(0, 4) + '…' + ME.addr.slice(-3) : ME.addr.slice(0, 9) + '…' + ME.addr.slice(-6)}${ic('copy', 14)}</div></div>
    <div class="wbtns"><button class="btn sec h32" data-a="switchWallet"><span>Switch wallet</span></button><button class="btn dsoft h32" data-a="disconnect"><span>Disconnect</span></button></div></div>
    <div class="kvs"><div><span>Network</span><b>Stellar Testnet</b></div><div><span>Connected</span><b>Today, 9:12 AM</b></div><div><span>Used for</span><b>${plural(used, 'agreement')}</b></div></div></div>
  ${sh('Balances', 'faucet', '', 'Get test USDC')}<div class="card rows bals">${bal('usdc', C.blue, 'USDC', 'Test USDC · Circle Testnet issuer', usd(S.bal), IS_CLIENT ? 'Available to fund' : 'In your wallet')}${bal('coin', C.pri, 'XLM', 'Pays network fees', '48.20 XLM', 'Enough for ~4,800 transactions')}</div>
  ${sh('In escrow')}<div class="kvs esc"><div><span>Locked as client</span><b>${usd(lk)}</b></div><div><span>Waiting to be released to you</span><b>${usd(wait)}</b></div></div>`;
}

/* ================= dialogs ================= */
const heroMedia = (k, err) => `<div class="hmedia"><img class="sky" src="${IMG[err ? 'BG-sunset2' : 'sky']}" alt="">${k ? `<img class="hil" src="${IMG[k]}" alt=""><span class="knot"></span>` : ''}<button class="x" data-a="close" aria-label="Close">${ic('close_line', 16)}</button></div>`;
const kv = rows => `<div class="kvs">${rows.map(r => `<div><span>${r[0]}</span>${r[2] ? `<span class="xl" data-a="explorer" data-v="${r[1]}">${r[1]}${ic('external', 14)}</span>` : `<b>${r[1]}</b>`}</div>`).join('')}</div>`;
const note = (t, i = 'info') => `<div class="note">${ic(i, 16)}<span>${t}</span></div>`;
const foot = (...b) => `<div class="foot">${b.join('')}</div>`;
const fb = (cls, a, label, v, w, dis) => `<button class="btn ${cls} h44" data-a="${a}"${v !== undefined ? ` data-v="${v}"` : ''}${w !== undefined ? ` data-w="${w}"` : ''}${dis ? ' disabled' : ''}><span>${label}</span></button>`;
const head = (t, p) => `<div class="dtx"><h3>${t}</h3><p>${p}</p></div>`;
const heroDlg = (k, inner, err) => `<div class="dlg hero">${heroMedia(k, err)}${inner}</div>`;
const ballDlg = (k, inner) => `<div class="dlg"><div class="dh"><div class="dtop">${balloon(k)}<button class="xs" data-a="close" aria-label="Close">${ic('close', 16)}</button></div>${inner}</div>`;
const handle = () => S.view === 'm' ? '<div class="handle"><i></i></div>' : '';
function walletRow(name, sub, right, act, extra = '') {
  return `<button class="wopt ${act ? 'act' : ''}" ${extra}><img class="lg" src="${IMG['wl-' + name.toLowerCase()]}" alt=""><span class="tx"><b>${name}</b>${sub}</span>${right}</button>`;
}

function modal() {
  const md = S.modal; if (!md) return '';
  let inner = '';
  const W = ['Freighter', 'xBull', 'Albedo', 'LOBSTR', 'Hana'];
  if (md.t === 'connect') inner = heroDlg('W-01', `${head(md.sw ? 'Switch wallet' : 'Connect a wallet', 'Pick a Stellar wallet. You’ll approve the connection in the wallet itself.')}
    <div class="wlist">${W.map((w, i) => walletRow(w, i === 0 ? '<span class="rec">Recommended</span>' : '', ic('right', 20), false, `data-a="pickWallet" data-v="${w}"`)).join('')}</div>${note('MileVault only reads your public address. We never see your keys.', 'lock')}`);
  if (md.t === 'connecting') inner = heroDlg('W-02', `${head(`Waiting for ${md.w}`, `Approve the connection request in ${md.w}. MileVault only asks for your public address.`)}
    ${walletRow(md.w, '<small>Waiting for approval…</small>', ic('loading', 20, C.pri, 'spin'), true)}${foot(fb('sec', 'connect', 'Choose another wallet'), fb('sec', 'walletDecline', 'Simulate decline'))}`);
  if (md.t === 'connDeclined') inner = heroDlg('W-05E', `${head('Connection declined', `You declined the request in ${md.w}. Nothing was shared and nothing changed.`)}${foot(fb('sec', 'connect', 'Choose another wallet'), fb('pri', 'pickWallet', 'Try again', md.w))}`, true);
  if (md.t === 'connected') inner = heroDlg('W-03', `${head('Wallet connected', `${md.w} is connected on Stellar Testnet. You can disconnect any time from Wallets.`)}
    ${kv([['Account', `${ME.name} · ${ME.short}`], ['Network', 'Stellar Testnet'], ['Agreements found', S.agreements.filter(a => a.client === ME_KEY || a.contributor === ME_KEY).length]])}${foot(fb('pri', 'enter', S.route.name === 'deeplink' ? 'Open Website redesign' : 'Go to dashboard'))}`);
  if (md.t === 'disconnect') inner = heroDlg('W-10', `${head('Disconnect Freighter?', 'Your agreements and escrow stay exactly as they are. Connect again any time to pick up where you left off.')}${foot(fb('sec', 'close', 'Cancel'), fb('danger', 'doDisconnect', 'Disconnect'))}`);
  if (md.t === 'received') { const a = ag(md.id); const m = a.ms[md.i]; const done = a.status === 'completed';
    inner = heroDlg(done ? 'M-07' : 'M-06', `${head(done ? 'Paid in full' : `You received ${usd(m.amount)}`, done ? `Aryan released the last milestone. You’ve received ${usd(total(a))} for ${esc(a.name)}.` : `Aryan released the payment for ${esc(m.title)}. It’s in your wallet now.`)}
    ${kv([['Amount', usd(m.amount)], ['Still locked for you', usd(locked(a))], ['Wallet balance', usd(S.bal)], [m.hash, m.hash, 1]].map((r, i) => i === 3 ? ['Transaction', r[1], 1] : r))}${foot(fb('pri', 'close', 'Done'))}`); }
  if (md.t === 'tx') inner = txModal(md);
  if (!inner) return '';
  const lock = md.t === 'tx' && (md.step === 'wait' || md.step === 'pending');
  return `<div class="ovl" data-a="${lock ? 'noop' : 'close'}" data-self="1">${inner.replace('<div class="dlg', handle() ? `<div class="dlg` : '<div class="dlg').replace(/(<div class="dlg[^"]*">)/, `$1${handle()}`)}</div>`;
}
function txModal(md) {
  const a = md.id ? ag(md.id) : null; const m = a && md.i !== undefined ? a.ms[md.i] : null; const info = txInfo(md); const T = TX[md.kind];
  const k = a ? PEOPLE[a.contributor] : PEOPLE.kay; const cl = a ? PEOPLE[a.client] : ME;
  if (md.step === 'review') {
    switch (md.kind) {
      case 'create': { const d = S.draft; return ballDlg('I-01', `${head(`Create ${esc(d.name)}`, `This records the agreement and its ${plural(d.ms.length, 'milestone')} on Stellar Testnet. No USDC moves yet.`)}</div>${kv(info.rows)}${note('You confirm this in Freighter. Stellar Testnet only, no real money moves.')}${foot(fb('sec', 'close', 'Cancel'), fb('pri', 'txSign', 'Confirm in Freighter'))}`); }
      case 'fund': { const need = total(a); const short = S.bal < need;
        return heroDlg('F-01', `${head(`Fund ${esc(a.name)}`, `Lock ${fmt(need)} test USDC in the escrow contract. It’s released to ${k.name} one milestone at a time.`)}
        ${kv([['Amount', `${fmt(need)} test USDC`], ['Milestones', `${a.ms.length} · ${andList(a.ms.map(x => num(x.amount)))}`], ['Your balance', `${fmt(S.bal)} → ${short ? '—' : usd(S.bal - need)}`], ['Network fee', '≈ 0.00001 XLM']])}
        ${short ? note(`You need ${usd(need - S.bal)} more. Get test USDC from the faucet, then try again.`, 'warning') : note('You can request cancellation later. Anything not yet released is refundable if both agree.')}
        ${foot(fb('sec', 'close', 'Cancel'), fb('pri', 'txSign', 'Confirm', undefined, undefined, short))}`); }
      case 'approve': return heroDlg('M-03', `${head(`Approve ${esc(m.title)}?`, `This records that you accept milestone ${md.i + 1}. It doesn’t pay ${k.name} yet; you release the ${usd(m.amount)} as the next step.`)}
        ${kv([['Submitted link', esc(m.link)], ['Amount to release next', usd(m.amount)], ['Network fee', '≈ 0.00001 XLM']])}${foot(fb('sec', 'close', 'Not yet'), fb('pri', 'txSign', 'Approve'))}`);
      case 'release': return ballDlg('I-01', `${head(`Release ${usd(m.amount)}`, `To ${k.name} for milestone ${md.i + 1}, ${esc(m.title)}. This pays from the escrow for ${esc(a.name)}.`)}</div>${kv([['Agreement', esc(a.name)], ['Milestone', `${md.i + 1} of ${a.ms.length} · ${esc(m.title)}`], ['To', `${k.name} · ${k.mid}`], ['Amount', `${fmt(m.amount)} test USDC`], ['Network fee', '≈ 0.00001 XLM']])}${note('You confirm this in Freighter. Stellar Testnet only, no real money moves.')}${foot(fb('sec', 'close', 'Cancel'), fb('pri', 'txSign', 'Release'))}`);
      case 'submit': { const e = S.errors;
        return heroDlg('M-01', `${head('Add your work', `Milestone ${md.i + 1} of ${a.ms.length}, ${esc(m.title)}. ${cl.first} reviews it before releasing ${usd(m.amount)}.`)}
        <div class="fld"><label class="lbl">Link to your work<span class="req">*</span></label><div class="inp ${e.link ? 'err' : ''}">${ic('link', 16, C.soft)}<input data-f="m.link" value="${esc(md.link)}" placeholder="https://"></div>${e.link ? `<div class="hint err">${ic('warning', 16)}${e.link}</div>` : `<div class="hint">${ic('info', 16)}<span>A Figma file, staging URL or repo. <span class="link" data-a="fillLink">Use an example</span></span></div>`}</div>
        <div class="fld"><label class="lbl">Note for ${cl.first}<span class="opt">(Optional)</span></label><div class="inp ta" style="height:88px"><textarea data-f="m.note" maxlength="300" placeholder="Anything they should know?">${esc(md.note)}</textarea></div></div>
        ${foot(fb('sec', 'close', 'Cancel'), fb('pri', 'submitReview', 'Submit'))}`); }
      case 'decline': return heroDlg('C-06', `${head(`Decline ${esc(a.name)}?`, `${cl.name} gets the ${usd(total(a))} back from escrow. You can’t accept it again after declining.`)}${kv(info.rows)}${foot(fb('sec', 'close', 'Keep it'), fb('danger', 'txSign', 'Decline'))}`);
      case 'cancel': return heroDlg('C-01', `${head(`Cancel ${esc(a.name)}?`, `It isn’t funded, so no money moves. ${k.first} sees it as cancelled and you can’t reopen it.`)}${kv(info.rows)}${foot(fb('sec', 'close', 'Keep it'), fb('danger', 'txSign', 'Cancel agreement'))}`);
    }
  }
  if (md.step === 'wait') return heroDlg('T-02', `${head('Check your wallet', `Approve the request in Freighter to ${esc(info.what)}. Nothing moves until you sign.`)}${walletRow('Freighter', '<small>Waiting for your signature…</small>', ic('loading', 20, C.pri, 'spin'), true)}${foot(fb('sec', 'close', 'Cancel'))}`);
  if (md.step === 'pending') return heroDlg('T-03', `${head('Waiting for the network', 'Submitted to Stellar Testnet. This usually takes a few seconds. MileVault updates the agreement as soon as it confirms.')}
    <div class="kvs"><div><span>Transaction</span><span class="xl" data-a="explorer" data-v="${md.hash}">${md.hash}${ic('external', 14)}</span></div><div><span>Status</span>${badge('processing')}</div></div>${foot(fb('sec', 'noop', 'Close'))}`);
  if (md.step === 'declined') return heroDlg('T-06E', `${head('You declined in Freighter', declinedText(md, a, m))}${foot(fb('sec', 'close', 'Cancel'), fb('pri', 'retry', 'Try again'))}`, true);
  if (md.step === 'done') {
    if (md.kind === 'fund') return heroDlg('F-02', `${head('Escrow funded', `${usd(total(a))} is locked in the contract. ${k.first} can see it’s funded and start on milestone 1.`)}${kv([['Locked', usd(total(a))], ['Your balance', usd(S.bal)], ['Transaction', md.hash, 1]])}${foot(fb('pri', 'close', 'Done'))}`);
    if (md.kind === 'release') { const done = a.status === 'completed';
      return heroDlg(done ? 'M-10' : 'M-06', `${head(done ? 'Agreement completed' : 'Payment released', done ? `${usd(m.amount)} is in ${k.name}’s wallet. Every milestone of ${esc(a.name)} is paid and the escrow is empty.` : `${usd(m.amount)} is in ${k.name}’s wallet. Milestone ${md.i + 1} is now Paid.`)}${kv([['Amount', usd(m.amount)], ['Left in escrow', usd(locked(a))], ['Transaction', md.hash, 1]])}${foot(fb('pri', 'close', 'Done'))}`); }
  }
  return '';
}
function declinedText(md, a, m) {
  switch (md.kind) {
    case 'fund': return `Nothing changed. ${esc(a.name)} is still awaiting funding and your ${usd(S.bal)} stays in your wallet.`;
    case 'release': return `Nothing changed. Milestone ${md.i + 1} is still Approved and the ${usd(m.amount)} stays in escrow.`;
    case 'approve': return `Nothing changed. ${esc(m.title)} is still waiting for your review.`;
    case 'create': return 'Nothing was created. Your draft is saved, so you can try again whenever you’re ready.';
    case 'submit': return `Nothing was submitted. ${esc(m.title)} is still ready for you to submit.`;
    default: return 'Nothing was signed and nothing changed.';
  }
}
function extPopup() {
  if (!S.ext || S.modal?.t !== 'tx') return '';
  const info = txInfo(S.modal);
  return `<div class="ext"><div class="arrow"></div><div class="eh"><img src="${IMG['wl-freighter']}" alt=""><div><b>Freighter</b><small>${ME.name} · ${ME.mid}</small></div><span class="net">Testnet</span></div>
  <div class="eb"><div class="site">${SAFARI.lock}milevault.app wants you to sign</div><h4>${info.ext}</h4><div class="fn">Contract call · <code>${info.fn}</code></div>${kv(info.rows)}</div>
  <div class="ef"><button class="rj" data-a="wReject">Reject</button><button class="ok" data-a="wApprove">Approve</button></div></div>
  ${S.view === 'd' ? '<div class="exthint">This is your Freighter extension. Approve to sign, or reject to see the declined state.</div>' : ''}`;
}
function menuHtml() {
  const m = S.menu; if (!m) return '';
  let items = '';
  if (m.k === 'ag') {
    const a = ag(S.route.id);
    items = `<button data-a="copy" data-v="https://milevault.app/a/${a.id}">${ic('link', 18)}Copy agreement link</button>${a.fundHash ? `<button data-a="explorer" data-v="${a.fundHash}">${ic('external', 18)}View funding on explorer</button>` : ''}<button data-a="tab" data-v="activity">${ic('history', 18)}Payment history</button>${IS_CLIENT && a.status === 'created' ? `<div class="sep"></div><button class="red" data-a="cancel" data-v="${a.id}">${ic('close_circle', 18)}Cancel agreement</button>` : ''}`;
  } else {
    items = `<button data-a="nav" data-v="transactions">${ic('transfer', 18)}Transactions</button><button data-a="nav" data-v="wallets">${ic('wallet', 18)}Wallets and balances</button><button data-a="copy" data-v="${ME.addr}">${ic('copy', 18)}Copy my address</button><div class="sep"></div><button class="red" data-a="disconnect">${ic('exit', 18)}Disconnect</button>`;
  }
  const pos = m.k === 'user' && S.view === 'd' ? `left:16px;top:${m.y}px` : `right:${Math.max(12, m.x)}px;top:${m.y}px`;
  return `<div class="click-catch" data-a="close" data-self="1"></div><div class="menu" style="${pos}">${items}</div>`;
}

/* ================= prototype panel ================= */
function panel() {
  const steps = journeySteps(); const nowIdx = steps.findIndex(s => !s[1]);
  const sim = simAction();
  return `<h1><span class="mk">${ic('safe_lock', 14)}</span>${IS_CLIENT ? 'Client journey' : 'Contributor journey'}</h1>
  <p class="lead">${IS_CLIENT ? 'You are Aryan Roy. Hire Kay Finley for a 1,500 USDC website redesign paid in three milestones.' : 'You are Kay Finley. Aryan Roy has funded a 1,500 USDC website redesign for you in three milestones.'}</p>
  <div class="sect"><label>Device</label><div class="seg"><button class="${S.view === 'd' ? 'on' : ''}" data-a="view" data-v="d">Desktop</button><button class="${S.view === 'm' ? 'on' : ''}" data-a="view" data-v="m">Mobile</button></div></div>
  <div class="sect"><label>Journey</label><ul class="steps">${steps.map((s, i) => `<li class="${s[1] ? 'done' : i === nowIdx ? 'now' : ''}"><span class="dot">${s[1] ? ic('check', 12) : i + 1}</span>${s[0]}</li>`).join('')}</ul></div>
  <div class="sect"><label>${IS_CLIENT ? 'Kay’s side' : 'Aryan’s side'}</label>${sim ? `<button class="simbtn" data-a="sim">${av(sim.who, 28)}<span><b style="font-weight:500">${esc(sim.label)}</b><small>${esc(sim.sub)}</small></span></button>` : `<div class="note">${ic('info', 16)}<span>${!S.connected ? 'Connect a wallet in the browser to start.' : `When ${IS_CLIENT ? 'Kay' : 'Aryan'} has something to do, a button appears here so you can play their part.`}</span></div>`}</div>
  <div class="foot"><div class="note">${ic('question', 16)}<span>Every transaction opens a simulated Freighter popup. Approve it, or reject it to see the declined state.</span></div>
  <button class="btn sec h32" style="width:100%;margin-top:8px" data-a="restart">${ic('refresh', 16)}<span>Restart journey</span></button>
  <div class="other">Also open the <a href="https://claude.ai/artifact/Kuu15xJxfu65b79pdtSPaF" target="_blank" rel="noopener">${IS_CLIENT ? 'contributor' : 'client'} journey</a>.</div></div>`;
}

/* ================= render ================= */
let lastKey = '';
function scale() { const el = document.querySelector('.devscale'); return el ? (parseFloat(el.dataset.s) || 1) : 1; }
function fit() {
  const wrap = document.querySelector('.devwrap'); const el = document.querySelector('.devscale'); if (!wrap || !el) return;
  const W = S.view === 'd' ? 1440 : 414, H = S.view === 'd' ? 900 : 868;
  const r = wrap.getBoundingClientRect();
  const s = Math.min(1, r.width / W, (r.height || window.innerHeight - 40) / H);
  el.style.transform = `scale(${s})`; el.style.width = W + 'px'; el.style.height = H + 'px'; el.style.margin = `${(H * s - H) / 2}px ${(W * s - W) / 2}px`; el.dataset.s = s;
}
function render(scrollTop = false) {
  const r = S.route.name; const m = S.view === 'm';
  let app;
  if (r === 'landing' || r === 'deeplink') app = `<div class="main"><div class="scroll" id="sc">${r === 'deeplink' ? deeplinkPage() : landing()}</div></div>`;
  else {
    const page = { dashboard, agreements: agreementsPage, agreement: agreementPage, new: newAgreement, created: createdPage, transactions: txPage, wallets: walletsPage }[r]();
    app = `${m ? '' : sidebar()}<div class="main">${m ? mobileTop() : ''}<div class="scroll" id="sc"><div class="col">${page}</div></div>${m ? tabBar() : ''}</div>`;
  }
  const overlays = `${menuHtml()}${modal()}${extPopup()}${S.toast && !S.modal ? toastHtml() : ''}`; if (S.modal && S.toast) S.toast = null;
  const device = `<div class="device ${S.view}">${m ? safariMobile() : safariDesktop()}<div class="app">${app}${overlays}</div>${m ? '<div class="island"></div>' : ''}</div>`;
  const prevScroll = document.getElementById('sc')?.scrollTop || 0;
  const ae = document.activeElement; const focusF = ae?.dataset?.f; const selS = ae?.selectionStart, selE = ae?.selectionEnd;
  document.getElementById('root').innerHTML = `<div class="stage"><div class="panel">${panel()}</div><div class="devwrap"><div class="devscale">${m ? `<div class="phone">${device}</div>` : device}</div></div></div>`;
  fit();
  const sc = document.getElementById('sc');
  const key = r + (S.route.id || '') + (S.draft?.step || '') + S.view + S.tab;
  if (sc) sc.scrollTop = (scrollTop || key !== lastKey) ? 0 : prevScroll;
  lastKey = key;
  if (focusF) { const el = document.querySelector(`[data-f="${focusF}"]`); if (el) { el.focus(); try { el.setSelectionRange(selS, selE); } catch (e) {} } }
}
function toastHtml() { const t = S.toast; return `<div class="toast">${ic('check_circle', 16)}<span>${esc(t.msg)}</span>${t.action ? `<a data-a="toastGo">${t.action}</a>` : ''}<button data-a="closeToast" style="color:#8A8A8A;display:flex">${ic('close', 14)}</button></div>`; }

/* ================= events ================= */
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  if (el.dataset.self && ev.target !== el) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  ev.stopPropagation(); ev.preventDefault();
  if (el.dataset.a === 'menu') return fn(el.dataset.v, el.dataset.w, el);
  fn(el.dataset.v, el.dataset.w);
});
document.addEventListener('input', ev => {
  const f = ev.target.dataset.f; if (!f) return;
  const v = ev.target.value;
  if (f === 'search') { S.search = v; render(); return; }
  if (f.startsWith('m.')) { S.modal[f.slice(2)] = v; if (S.errors.link) { S.errors = {}; render(); } return; }
  if (f.startsWith('ms.')) { const [, i, k] = f.split('.'); S.draft.ms[+i][k] = v; }
  else S.draft[f] = v;
  if (S.errors[f]) { delete S.errors[f]; render(); return; }
  const tot = S.draft.ms.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const te = document.getElementById('tot'); if (te) te.textContent = usd(tot);
  const tn = document.getElementById('totnote'); if (tn) tn.textContent = `You’ll fund the full ${usd(tot)} in one step after creating.`;
  const c = document.getElementById('cnt-' + f); if (c) c.textContent = `${v.length}/500`;
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { if (S.menu) { S.menu = null; render(); } else if (S.modal && !(S.modal.t === 'tx' && ['wait', 'pending'].includes(S.modal.step)) && S.modal.t !== 'connecting') { S.modal = null; render(); } }
  if (ev.key === 'Enter' && S.modal?.t === 'tx' && S.modal.kind === 'submit' && S.modal.step === 'review' && ev.target.dataset?.f === 'm.link') A.submitReview();
});
window.addEventListener('resize', fit);

reset(); render();
