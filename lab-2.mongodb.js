use("mflix");

db.getCollectionNames();

db.users.find().limit(1).toArray();

db.theaters.findOne();

// Tareas

// 1. Cantidad de cines (theaters) por estado.
db.theaters.aggregate([
  {
    $group: {
      _id: "$location.address.state",
      count: { $sum: 1 },
    },
  },
]);

// 2. Cantidad de estados con al menos dos cines (theaters)
// registrados.

db.theaters.aggregate([
  {
    $group: {
      _id: "$location.address.state",
      count: { $sum: 1 },
    },
  },
  {
    $match: {
      count: { $gte: 2 },
    },
  },
]);

// 3. Cantidad de películas dirigidas por "Louis Lumière". Se
// puede responder sin pipeline de agregación, realizar ambas
// queries.
db.movies.findOne();

// Sin pipeline
db.movies.find({ directors: { $in: ["Louis Lumière"] } }).count();

// Con pipeline
db.movies.aggregate([
  { $match: { directors: { $in: ["Louis Lumière"] } } },
  { $count: "cantidad" },
]);

// 4. Cantidad de películas estrenadas en los años 50
// (desde 1950 hasta 1959). Se puede responder sin pipeline
// de agregación, realizar ambas queries.
db.movies.findOne();
// Sin pipeline
db.movies.find({ year: { $gte: 1950, $lte: 1959 } }).count();

// Con pipeline
db.movies.aggregate([
  {
    $match: {
      year: { $gte: 1950, $lte: 1959 },
    },
  },
  {
    $count: "cantidad",
  },
]);

// 5. Listar los 10 géneros con mayor cantidad de películas
// (tener en cuenta que las películas pueden tener más de un
// género). Devolver el género y la cantidad de películas.
// Hint: unwind puede ser de utilidad
db.movies.findOne();

db.movies.aggregate([
  {
    $unwind: "$genres",
  },
  {
    $group: {
      _id: "$genres",
      peliculas: { $sum: 1 },
    },
  },
  { $sort: { peliculas: -1 } },
  { $limit: 10 },
]);

// 6. Top 10 de usuarios con mayor cantidad de comentarios,
// mostrando Nombre, Email y Cantidad de Comentarios.
db.comments.aggregate([
  {
    $group: {
      _id: { nombre: "$name", email: "$email" },
      comentarios: { $sum: 1 },
    },
  },
  {
    $sort: { comentarios: -1 },
  },
  {
    $limit: 10,
  },
]);

// 7. Ratings de IMDB promedio, mínimo y máximo por año de las
// películas estrenadas en los años 80 (desde 1980 hasta 1989)
// , ordenados de mayor a menor por promedio del año.
db.movies.findOne();

db.movies.aggregate([
  {
    $match: {
      year: { $gte: 1980, $lte: 1989 },
      "imdb.rating": { $type: "number" }, // Solo documentos donde el rating es numérico
    },
  },
  {
    $group: {
      _id: "$year",
      promedio: { $avg: "$imdb.rating" },
      mínimo: { $min: "$imdb.rating" },
      máximo: { $max: "$imdb.rating" },
    },
  },
  {
    $sort: { promedio: -1 },
  },
]);

// 8. Título, año y cantidad de comentarios de las 10 películas
// con más comentarios.
db.comments.findOne();

db.comments.aggregate([
  {
    $group: {
      _id: "$movie_id",
      comentarios: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: "movies",
      localField: "_id",
      foreignField: "_id",
      as: "pelicula",
    },
  },
  {
    $sort: { comentarios: -1 },
  },
  {
    $limit: 10,
  },
]);

// 9. Crear una vista con los 5 géneros con mayor cantidad de
// comentarios, junto con la cantidad de comentarios.

db.comments.aggregate([
  {
    $lookup: {
      from: "movies",
      localField: "movie_id",
      foreignField: "_id",
      as: "movie",
    },
  },
  {
    $unwind: {
      path: "$movie", // Descompone el array movie
    },
  },
  {
    $unwind: "$movie.genres",
  },
  {
    $group: {
      _id: "$movie.genres",
      comentarios: { $sum: 1 },
    },
  },
  {
    $sort: { comentarios: -1 },
  },
  {
    $limit: 5,
  },
]);

db.createView("generos_mas_comentados", "comments", [
  {
    $lookup: {
      from: "movies",
      localField: "movie_id",
      foreignField: "_id",
      as: "movie",
    },
  },
  {
    $unwind: {
      path: "$movie", // Descompone el array movie
    },
  },
  {
    $unwind: "$movie.genres",
  },
  {
    $group: {
      _id: "$movie.genres",
      comentarios: { $sum: 1 },
    },
  },
  {
    $sort: { comentarios: -1 },
  },
  {
    $limit: 5,
  },
]);

db.generos_mas_comentados.find();

// para borrarla
db.generos_mas_comentados.drop();

// 10. Listar los actores (cast) que trabajaron en 2 o más
// películas dirigidas por "Jules Bass". Devolver el nombre de
// estos actores junto con la lista de películas (solo título
// y año) dirigidas por “Jules Bass” en las que trabajaron.
// Hint1: addToSet
// Hint2: {'name.2': {$exists: true}} permite filtrar arrays
// con al menos 2 elementos, entender por qué.
// Hint3: Puede que tu solución no use Hint1 ni Hint2 e
// igualmente sea correcta
db.getCollectionNames();
db.movies.findOne();

// Para ver todos los valores existentes en cada array de cada atributo
db.movies.aggregate([
  { $unwind: "$cast" },
  { $group: { _id: null, uniques: { $addToSet: "$cast" } } },
]);

db.movies.aggregate([
  {
    $match: {
      directors: { $in: ["Jules Bass"] },
    },
  },
  {
    $unwind: {
      path: "$cast",
      preserveNullAndEmptyArrays: false,
    },
  }, // Problema: si un nombre de actor esta repetido en algun cast
  {
    $group: {
      _id: "$cast",
      peliculas: { $addToSet: "$title" }, // <-- Solucion (en vez de { $push: "$title" })
    },
  },
  {
    $match: {
      "peliculas.2": { $exists: true },
    },
  },
]);

// 11. Listar los usuarios que realizaron comentarios durante el
// mismo mes de lanzamiento de la película comentada, mostrando
// Nombre, Email, fecha del comentario, título de la película,
// fecha de lanzamiento.
// HINT: usar $lookup con multiple condiciones
db.getCollectionNames();
db.comments.findOne();

// TODO: PREGUNTAR: desde que tabla es mejor hacer join? (mejor mas o menos tablas y arrays mas largos?)
// TODO: PREGUNTAR: movie solo tiene campo año, no mes
db.movies.aggregate([
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "movie_id",
      as: "comments",
      let: {
        año: { $year: "$lastUpdated.date" }, // TODO: se uso esto
        mes: { $month: "$lastUpdated.date" },
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [{ $year: "$date.date" }, "$$año"],
              $eq: [{ $month: "$date.date" }, "$$mes"],
            },
          },
        },
      ],
    },
  }, // TODO: PREGUNTAR: por que cambia lastupdated.date por lastupdated solo?
  {
    $unwind: {
      path: "$comments",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $project: {
      titulo: "$title",
      lanzamiento: "$lastupdated",
      comentado: "$comments.date.date", // TODO: por que no se lista?
      nombre: "$comments.name",
      email: "$comments.email",
    },
  },
]);

// 12. Listar el id y nombre de los restaurantes junto con su
// puntuación máxima, mínima y la suma total. Se puede asumir que
// el restaurant_id es único.
db.getCollectionNames();
db.restaurants.findOne();

// TODO: PREGUNTAR: que diferencia hay entre usar _id y restaurant_id
// 12.a Resolver con $group y accumulators.

db.restaurants.aggregate([
  // TODO: asi esta bien, esta era la idea?
  {
    $unwind: {
      path: "$grades",
      preserveNullAndEmptyArrays: true, //ver
    },
  },
  {
    $group: {
      _id: "$_id",
      suma: { $sum: "$grades.score" },
      mínimo: { $min: "$grades.score" },
      máximo: { $max: "$grades.score" },
      nombre: { $first: "$name" },
      id: { $first: "$restaurant_id" },
    },
  },
]);

// 12.b Resolver con expresiones sobre arreglos (por ejemplo, $sum) pero sin $group.

db.restaurants.aggregate([
  {
    $project: {
      suma: { $sum: "$grades.score" },
      mínimo: { $min: "$grades.score" },
      máximo: { $max: "$grades.score" },
      nombre: "$name",
      id: "$restaurant_id",
    },
  },
]);

// 12.c Resolver como en el punto b) pero usar $reduce para
// calcular la puntuación total.

db.restaurants.aggregate([
  {
    $project: {
      suma: {
        $reduce: {
          input: "$grades", // Array
          initialValue: 0,
          in: { $add: ["$$value", "$$this.score"] },
          // in: Expresión que se aplicará en cada iteración.
          // $$value: Valor acumulado hasta el momento
          // $$this: Elemento del arreglo que se está procesando.
        },
      },
      mínimo: { $min: "$grades.score" },
      máximo: { $max: "$grades.score" },
      nombre: "$name",
      id: "$restaurant_id",
    },
  },
]);

// 12.d Resolver con find.

db.restaurants.find(
  {},
  {
    suma: { $sum: "$grades.score" },
    mínimo: { $min: "$grades.score" },
    máximo: { $max: "$grades.score" },
    nombre: "$name",
    id: "$restaurant_id",
  }
);

// 13. Actualizar los datos de los restaurantes añadiendo dos
// campos nuevos.
// Se debe actualizar con una sola query.
// HINT1. Se puede usar pipeline de agregación con la operación
// update
// HINT2. El operador $switch o $cond pueden ser de ayuda.

// Sintaxis:
// { $cond: [ <condición>, <valor_si_verdadero>, <valor_si_falso> ] }
// {
//   $switch: {
//     branches: [
//       { case: <condición_1>, then: <resultado_1> },
//       { case: <condición_2>, then: <resultado_2> },
//       ...
//     ],
//     default: <resultado_por_defecto>
//   }
// }

// "average_score": con la puntuación promedio
// "grade": con "A" si "average_score" está entre 0 y 13,
//   con "B" si "average_score" está entre 14 y 27
//   con "C" si "average_score" es mayor o igual a 28

// Sintaxis:
// db.<collection>.updateMany(
//   { <filtro> },                  // Criterio para seleccionar los documentos
//   { $set: { <nuevoCampo>: <valor> } } // Agrega el nuevo campo
// )

db.restaurants.findOne();

// Con cond:
db.restaurants.updateMany({}, [
  {
    $set: { average_score: { $avg: "$grades.score" } },
  },
  {
    $set: {
      grade: {
        $cond: [
          {
            $and: [
              { $gte: ["$average_score", 0] },
              { $lte: ["$average_score", 13] },
            ],
          },
          "A",
          {
            $cond: [
              {
                $and: [
                  { $gte: ["$average_score", 14] },
                  { $lte: ["$average_score", 27] },
                ],
              },
              "B",
              { $cond: [{ $gte: ["$average_score", 28] }, "C", null] },
            ],
          },
        ],
      },
    },
  },
]);

// Con switch:
db.restaurants.updateMany({}, [
  {
    $set: { average_score: { $avg: "$grades.score" } },
  },
  {
    $set: {
      grade: {
        $switch: {
          branches: [
            {
              case: {
                $and: [
                  { $gte: ["$average_score", 0] },
                  { $lte: ["$average_score", 13] },
                ],
              },
              then: "A",
            },
            {
              case: {
                $and: [
                  { $gte: ["$average_score", 14] },
                  { $lte: ["$average_score", 27] },
                ],
              },
              then: "B",
            },
            {
              case: { $gte: ["$average_score", 28] },
              then: "C",
            },
          ],
          default: null,
        },
      },
    },
  },
]);
