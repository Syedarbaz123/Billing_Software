const User = require('../models').User;
const BaseRepository = require('./BaseRepository')

const UserRepository = class extends BaseRepository {
    constructor(model = null) {
        if (model == null) {
            model = User;
        }
        super(model)
    }

    create = async (attributes) => {
        return await super.create(attributes);
    }
}
module.exports = UserRepository;

