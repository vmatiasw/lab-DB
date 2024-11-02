use("mflix");

db.getCollectionNames();

db.users.find().limit(1).toArray();

db.comments.findOne();

// Tareas

// 1 Insertar 5 nuevos usuarios en la colección users.
// Para cada nuevo usuario creado, insertar al menos un
// comentario realizado por el usuario en la colección
// comments.

db.users.insertMany([
  { name: "Ned", email: "ned@game.es", password: "12" },
  { name: "Jon Snow", email: "jonw@game.es", password: "32" },
  { name: "Daenerys", email: "daes@thron.es", password: "23" },
  { name: "Tyrion", email: "tyrion@thron.es", password: "43" },
  { name: "Lannister", email: "cersei@thron.es", password: "45" },
]);

db.users.find({ name: "Ned" });

db.comments.insertMany([
  {
    name: "Ned",
    email: "ned@game.es",
    movie_id: ObjectId("573a1390f29313caabcd418c"),
    text: "No puedo esperar a que llegue el invierno.",
    date: new Date("2024-10-18T00:00:00Z"), // Probar dejar vacio
  },
  {
    name: "Jon Snow",
    email: "jonw@game.es",
    movie_id: ObjectId("573a1390f29313caabcd418c"),
    text: "El verdadero norte es donde se encuentra el honor.",
    date: new Date("2024-10-18T00:00:00Z"),
  },
  {
    name: "Daenerys",
    email: "daes@thron.es",
    movie_id: ObjectId("573a1390f29313caabcd418c"),
    text: "Soy el fuego que arde.",
    date: new Date("2024-10-18T00:00:00Z"),
  },
  {
    name: "Tyrion",
    email: "tyrion@game.es",
    movie_id: ObjectId("573a1390f29313caabcd418c"),
    text: "A veces, el mejor camino es el más difícil.",
    date: new Date("2024-10-18T00:00:00Z"),
  },
  {
    name: "Lannister",
    email: "cersei@game.es",
    movie_id: ObjectId("573a1390f29313caabcd418c"),
    text: "Cuando juegas al juego de tronos, ganas o mueres.",
    date: new Date("2024-10-18T00:00:00Z"),
  },
]);

db.comments.find({ name: "Ned" });

// 2 Listar el título, año, actores (cast), directores y
// rating de las 10 películas con mayor rating
// (“imdb.rating”) de la década del 90. ¿Cuál es el valor
// del rating de la película que tiene mayor rating?
// (Hint: Chequear que el valor de “imdb.rating” sea de
// tipo “double”).

db.getCollectionNames();

db.movies.findOne();

db.movies
  .find(
    { year: 1990, "imdb.rating": { $type: "double" } },
    { "imdb.rating": 1, title: 1 }
  )
  .sort({ "imdb.rating": -1 })
  .limit(10);

// 3 Listar el nombre, email, texto y fecha de los
// comentarios que la película con id (movie_id)
// ObjectId("573a1399f29313caabcee886") recibió entre
// los años 2014 y 2016 inclusive. Listar ordenados por
// fecha.

db.getCollectionNames();

// a
const startDate = ISODate("2014-01-01T00:00:00Z");
const endDate = new Date("2016-12-31T23:59:59Z"); // Ambas formas estan bien
db.comments
  .find(
    {
      movie_id: ObjectId("573a1399f29313caabcee886"),
      date: { $gte: startDate, $lte: endDate },
    },
    {
      name: 1,
      email: 1,
      text: 1,
      date: 1,
    }
  )
  .sort({ date: 1 });

// b Escribir una nueva consulta (modificando la
// anterior) para responder ¿Cuántos comentarios recibió?

startDate = ISODate("2014-01-01T00:00:00Z");
endDate = new Date("2016-12-31T23:59:59Z"); // Ambas formas estan bien
db.comments
  .find(
    {
      movie_id: ObjectId("573a1399f29313caabcee886"),
      date: { $gte: startDate, $lte: endDate },
    },
    {
      name: 1,
      email: 1,
      text: 1,
      date: 1,
    }
  )
  .count();

// 4. Listar el nombre, id de la película, texto y fecha de
// los 3 comentarios más recientes realizados por el
// usuario con email patricia_good@fakegmail.com.
db.getCollectionNames();

db.comments
  .find(
    { email: { $eq: "patricia_good@fakegmail.com" } },
    { name: 1, movie_id: 1, text: 1, date: 1 }
  )
  .sort({ date: 1 })
  .limit(3);

// 5. Listar el título, idiomas (languages), géneros, fecha
// de lanzamiento (released) y número de votos
// (“imdb.votes”) de las películas de géneros Drama y
// Action (la película puede tener otros géneros
// adicionales), que solo están disponibles en un único
// idioma y por último tengan un rating (“imdb.rating”)
// mayor a 9 o bien tengan una duración (runtime) de al
// menos 180 minutos. Listar ordenados por fecha de
// lanzamiento y número de votos.
db.getCollectionNames();

db.movies
  .find(
    {
      $and: [
        { genres: { $all: ["Action", "Drama"] } },
        { languages: { $size: 1 } },
        { $or: [{ "imdb.rating": { $gte: 9 } }, { runtime: { $gte: 180 } }] },
      ],
    },
    {
      title: 1,
      genres: 1,
      year: 1,
      "imdb.votes": 1,
      languages: 1,
    }
  )
  .sort({ year: 1, "imdb.votes": 1 });

// Para ver todos los valores existentes en cada array de cada atributo
db.movies.aggregate([
  { $unwind: "$genres" }, // Desenrolla el arreglo de géneros
  { $group: { _id: null, uniqueGenres: { $addToSet: "$genres" } } },
]);

// 6. Listar el id del teatro (theaterId), estado
// (“location.address.state”), ciudad
// (“location.address.city”), y coordenadas
// (“location.geo.coordinates”) de los teatros que
// se encuentran en algunos de los estados "CA", "NY",
// "TX" y el nombre de la ciudades comienza con una ‘F’.
// Listar ordenados por estado y ciudad.
db.getCollectionNames();

db.theaters.find(
  {
    "location.address.state": { $in: ["CA", "NY", "TX"] },
    "location.address.city": { $regex: "^F" },
  },
  {
    theaterId: 1,
    "location.address.state": 1,
    "location.address.city": 1,
    "location.geo.coordinates": 1,
  }
);

// 7. Actualizar los valores de los campos texto (text) y fecha (date) del
// comentario cuyo id es ObjectId("5b72236520a3277c015b3b73") a "mi mejor
// comentario" y fecha actual respectivamente.

db.comments.updateOne(
  { _id: ObjectId("5b72236520a3277c015b3b73") },
  {
    $set: {
      text: "mi mejor comentario",
      date: new Date(),
    },
  }
);

db.comments.findOne({ _id: { $eq: ObjectId("5b72236520a3277c015b3b73") } });

// 8. Actualizar el valor de la contraseña del usuario cuyo email es
// joel.macdonel@fakegmail.com a "some password". La misma consulta debe
// poder insertar un nuevo usuario en caso que el usuario no exista.
// Ejecute la consulta dos veces. ¿Qué operación se realiza en cada caso?
// (Hint: usar upserts).

db.users.updateOne(
  { email: "joel.macdonel@fakegmail.com" },
  { $set: { password: "some password" } },
  { upsert: true }
);

// Primera vez:
// {
//   "acknowledged": true,
//   "insertedId": {
//     "$oid": "67130684c55135bcf48a1c58"
//   },
//   "matchedCount": 0,
//   "modifiedCount": 0,
//   "upsertedCount": 1
// }

// Segunda vez:
// {
//   "acknowledged": true,
//   "insertedId": null,
//   "matchedCount": 1,
//   "modifiedCount": 0,
//   "upsertedCount": 0
// }

db.users.insertOne({
  email: "joel.macdonel@fakegmail.com",
  password: "some password",
});
// Al incertarlo:
// {
//   "acknowledged": true,
//   "insertedId": {
//     "$oid": "67130718942743cbc32c095e"
//   }
// }

db.users.deleteOne({ email: "joel.macdonel@fakegmail.com" });

db.users.findOne({ email: "joel.macdonel@fakegmail.com" });

// 9. Remover todos los comentarios realizados por el usuario cuyo email
// es victor_patel@fakegmail.com durante el año 1980.

db.comments.deleteMany({
  $and: [{ email: "victor_patel@fakegmail.com" }, { year: { $eq: 1980 } }],
});
// Equivalente:
db.comments.deleteMany({
  email: "victor_patel@fakegmail.com",
  year: 1980
});

