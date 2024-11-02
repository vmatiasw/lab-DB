const tabla = db.movies

// Para ver todos los valores existentes en cada array de cada atributo
const value = "$cast";
tabla.aggregate([
  { $unwind: value },
  { $group: { _id: null, uniques: { $addToSet: value } } },
]);

// Para ver todas las tablas
db.getCollectionNames();

// Para ver un objeto de una tabla
tabla.findOne();
