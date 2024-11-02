use("restaurantdb");

db.getCollectionNames();

db.restaurants.findOne();

// 10. Listar el id del restaurante (restaurant_id) y
// las calificaciones de los restaurantes donde al
// menos una de sus calificaciones haya sido realizada
// entre 2014 y 2015 inclusive, y que tenga una
// puntuación (score) mayor a 70 y menor o igual a 90.

db.restaurants.find(
  {
    grades: {
      $elemMatch: {
        // Halla una que cumpla ambas
        date: { $gte: new Date("2014-01-01"), $lte: new Date("2015-12-31") },
        score: { $gt: 70, $lte: 90 },
      },
    },
  },
  { restaurant_id: 1, grades: 1 }
);

db.restaurants.find(
  {
    "grades.date": {
      $gte: new Date("2014-01-01"),
      $lte: new Date("2015-12-31"),
    }, // Halla alguna que cumpla alguna
    "grades.score": { $gt: 70, $lte: 90 },
  },
  { restaurant_id: 1 }
);
// 11. Agregar dos nuevas calificaciones al restaurante
// cuyo id es "50018608". A continuación se especifican
// las calificaciones a agregar en una sola consulta.

// {
// 	"date" : ISODate("2019-10-10T00:00:00Z"),
// 	"grade" : "A",
// 	"score" : 18
// }

// {
// 	"date" : ISODate("2020-02-25T00:00:00Z"),
// 	"grade" : "A",
// 	"score" : 21
// }

db.restaurants.updateOne(
  { restaurant_id: "50018608" },
  {
    // $push: <array:{...}>para agregar elementos a un array en un documento
    $push: {
      grades: {
        // $each: <[...]> para insertar múltiples elementos al array en una sola operación
        $each: [
          {
            date: ISODate("2019-10-10T00:00:00Z"),
            grade: "A",
            score: 18,
          },
          {
            date: ISODate("2020-02-25T00:00:00Z"),
            grade: "A",
            score: 21,
          },
        ],
      },
    },
  }
);

// TODO: PREGUNTAR: ¿por que devuelve uno de mas y dif?
db.restaurants.findOne(
  {
    restaurant_id: "50018608",
    $and: [
      {
        grades: {
          $elemMatch: {
            date: ISODate("2019-10-10T00:00:00Z"),
            grade: "A",
            score: 18,
          },
        },
      },
      {
        grades: {
          $elemMatch: {
            date: ISODate("2020-02-25T00:00:00Z"),
            grade: "A",
            score: 21,
          },
        },
      },
    ],
  },
  { grades: 1 }
);

// ver todos los documentos que tienen un valor específico
db.restaurants.find({ "grades.score": 12 }).pretty();
