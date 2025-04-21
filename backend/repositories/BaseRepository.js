const BaseRepository = class {
    model = null;

    constructor(modal) {
        this.model = modal
    }

    async create(attributes) {
        return this.model.create(attributes);
    };

    async update(attributes) {
        console.log(attributes)
        return await this.model.update(attributes);
    };
}
module.exports = BaseRepository;