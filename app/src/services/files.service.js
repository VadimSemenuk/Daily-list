class FilesService {
    async getFileEntry(path) {
        return new Promise((resolve) => {
            window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, () => {
                window.resolveLocalFileSystemURL(path, resolve);
            })
        })
    }
}

let filesService = new FilesService();

export default filesService;