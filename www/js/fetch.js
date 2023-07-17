export async function fetch(path) {
    const url = "https://oreluniver.ru/schedule/";
    const options = {
        method: 'get',
    };

    console.info(`RES: ${url}${path}`);

    return new Promise((res, rej) => {
        cordova.plugin.http.sendRequest(`${url}${path}`, options,
            response => {
                res(JSON.parse(response.data));
            },
            response => {
                rej(response);
        });
    });
}

export async function setHeaders() {
    await cordova.plugin.http.setDataSerializer('json');
    await cordova.plugin.http.setCookie("https://oreluniver.ru/", "CurrentSchedule=lesson; StudPrepAudit=1; session-cookie=1766cd595c10489a1209624fb4819f5b355ff3c2ef1d2116739635c10467a3338ffc212826a8dcc829e289e08f770c98; PHPSESSID=c7cfuukl9412lvpge6c2obi7p5; blind-font-size=fontsize-normal; blind-colors=color1; blind-font=sans-serif; blind-spacing=spacing-small; blind-images=imagesoff; csrf-token-name=csrftoken; csrf-token-value=1766cd5a0463f985e919f16b85759cf5efbc06059050da3b8fde7903d11447104e0544af99bbdf9b");
}
