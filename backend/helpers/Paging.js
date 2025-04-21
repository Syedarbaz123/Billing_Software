const getPagination = (page, size) => {
    const limit = size ? +size : 7;
    const offset = page ? (+page - 1) * limit : 0; 
    return { limit, offset };
};
const getPagingData = async (data, page, size, search) => {
    let { count: totalItems } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / size);
    return { currentPage, totalItems, totalPages, size, search }
};

module.exports = {
    getPagination: getPagination,
    getPagingData: getPagingData
}