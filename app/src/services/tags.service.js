import executeSQL from '../utils/executeSQL';

class TagsService {
    tags = {};

    async updateCache() {
        (await this.getTags()).forEach((tag) => {
            this.tags[tag.id] = tag;
        });
    }

    async getTags() {
        let select = await executeSQL(`SELECT id, name FROM Tags;`);

        let tags = [];
        for(let i = 0; i < select.rows.length; i++) {
            tags.push(select.rows.item(i));
        }

        return tags;
    }

    async addTag(tag) {
        let insert = await executeSQL(`
            INSERT INTO Tags (name)
            VALUES (?)
        `, [tag.name]);

        await this.updateCache();

        return insert.insertId;
    }

    async updateTag(tag) {
        await executeSQL(`
            UPDATE Tags 
            SET name = ?
            WHERE id = ?
        `, [tag.name, tag.id]);

        await this.updateCache();
    }

    async deleteTag(tagId) {
        await executeSQL(`
            DELETE FROM Tags 
            WHERE id = ?
        `, [tagId]);

        await this.updateCache();
    }
}

let tagsService = new TagsService();

export default tagsService;