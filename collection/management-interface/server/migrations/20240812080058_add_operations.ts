import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('operations', (table) => {
    table.increments('id').primary() // Assuming you want an auto-incrementing primary key
    table.integer('createdAt').notNullable()
    table.enu('status', ['queued', 'processing', 'completed', 'failed']).notNullable()
    table.json('payload').notNullable()
    table.string('description').notNullable()
    table.string('message').nullable() // Optional field
    table.string('details').nullable() // Optional field
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('operations')
}
