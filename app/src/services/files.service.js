class FilesService {
    async getFileEntry(path) {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, () => {
                window.resolveLocalFileSystemURL(path, resolve, reject);
            })
        })
    }

    async writeFile(fileEntry, blob) {
        return new Promise((resolve, reject) => {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function() {
                    resolve(true);
                };
                fileWriter.onerror = function(err) {
                    reject(err);
                };
                fileWriter.write(blob);
            });
        })
    }
}

let filesService = new FilesService();

export default filesService;