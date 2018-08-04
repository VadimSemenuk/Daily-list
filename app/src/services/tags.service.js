let tags = [
    'transparent', 
    '#00213C', 
    '#c5282f', 
    '#62A178', 
    '#3498DB', 
    '#BF0FB9', 
    '#9A6B00', 
    '#9CECC5', 
    '#e2dd2d', 
    '#e23494', 
    '#7e17dc', 
    '#333', 
    "#bfbfbf"
];

class TagsService {
    getTags() {
        return [...tags];
    }

    getTagByIndex(index) {
        return tags[index];
    }
}

let tagsService = new TagsService();

export default tagsService;