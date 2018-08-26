module.exports = (model, values, condition) => {
    return model
        .findOne({where: condition})
        .then(function (obj) {
            if (obj) { // update
                return obj.update(values);
            }
            else { // insert
                return model.create(values);
            }
        })
}