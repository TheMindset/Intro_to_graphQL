const environment = process.env.NODE_ENV || 'development'
const configuration = require('../../knexfile')[environment]
const database = require('knex')(configuration)

class Owner {
  static findOwner(id) {
    return database('owners')
    .where('id', id)
    .first()
  }

  static findOwnersPets(id) {
    return database('owners')
    .join('pets', {'owners.id': 'pets.owner_id'})
    .where('pets.owner_id', id)
  }

  static findAllOwners() {
    return database('owners')
    .select()
  }

  static addOwners(owner_data) {
    return database('owners')
    .returning('*')
    .insert({
      name: owner_data.name,
      age: owner_data.age
    })
  }

  static deleteOwner(id) {
    return database('owners')
    .where('id', id)
    .del()
  }
}

module.exports = Owner