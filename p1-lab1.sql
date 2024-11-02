-- Practico 2

SHOW DATABASES;
USE world;
SHOW TABLES;

-- 1.2 generar los esquemas correspondientes al diagrama

CREATE TABLE country (
    Code VARCHAR(50) NOT NULL UNIQUE,
    Name VARCHAR(50),
    Continent VARCHAR(50),
    Region VARCHAR(50),
    SurfaceArea FLOAT,
    IndepYear INT,
    Poblacion INT,
    ExpectativaVida FLOAT,
    GNP INT,
    GNPOld INT,
    LocalName VARCHAR(50),
    GovernmentForm VARCHAR(50),
    HeadOfState VARCHAR(50),
    Capital INT,
    Code2 VARCHAR(50),
    PRIMARY KEY (Code)
);

CREATE TABLE city (
    ID INT AUTO_INCREMENT NOT NULL UNIQUE,
    Name VARCHAR(50),
    CountryCode VARCHAR(50) NOT NULL,
    District VARCHAR(50),
    Poblacion INT,
    PRIMARY KEY (ID),
    FOREIGN KEY (CountryCode) REFERENCES country(Code)
);

CREATE TABLE countrylanguage (
    CountryCode VARCHAR(50) NOT NULL,
    Languaje VARCHAR(50) NOT NULL,
    IsOfficial VARCHAR(50),
    Percentage DOUBLE,
    PRIMARY KEY (CountryCode, Languaje),
    FOREIGN KEY (CountryCode) REFERENCES country(Code)
);

-- 1.4 Crear una tabla "Continent"

CREATE TABLE continent (
    Name VARCHAR(50) NOT NULL UNIQUE,
    Area INT,
    PercentTotalMass DOUBLE,
    MostPopulousCity VARCHAR(50),
    PRIMARY KEY (Name)
);

-- FOREIGN KEY (MostPopulousCity) REFERENCES city(Name) -- MostPopulousCity = pais, ciudad ; como hago? las ciudades si pueden repetirse

-- 1.5 Inserte los siguientes valores en la tabla "Continent"

INSERT INTO `continent` (`Name`, `Area`, `PercentTotalMass`, `MostPopulousCity`) VALUES
('Africa', 30370000, 20.4, 'Cairo, Egypt'),
('Antarctica', 14000000, 9.2, 'McMurdo Station*'),
('Asia', 44579000, 29.5, 'Mumbai, India'),
('Europe', 10180000, 6.8, 'Instanbul, Turquia'),
('North America', 24709000, 16.5, 'Ciudad de México, Mexico'),
('Oceania', 8600000, 5.9, 'Sydney, Australia'),
('South America', 17840000, 12.0, 'São Paulo, Brazil');

-- 1.6 Modificar la tabla "country" de manera que el campo "Continent" pase a ser una clave externa (o foreign key) a la tabla Continent.
DELETE FROM city;
DELETE FROM countrylanguage;
DELETE FROM country;
DELETE FROM continent;

ALTER TABLE `country` ADD 
	FOREIGN KEY (`Continent`) REFERENCES continent(`Name`) ;

-- Parte 2: Consultas

SELECT * FROM country LIMIT 1

-- 2.1 Lista de nombres y regiones a las que pertenece cada país ordenada alfabéticamente.
SELECT Region,Name FROM country ORDER BY Region ASC, Name ASC

-- 2.2 Liste el nombre y la población de las 10 ciudades más pobladas del mundo.
SELECT Poblacion,Name FROM country ORDER BY Poblacion DESC LIMIT 10;

-- 2.3 Liste el nombre, región, superficie y forma de gobierno de los 10 países con menor superficie.
SELECT Region,Name, SurfaceArea, GovernmentForm FROM country ORDER BY SurfaceArea ASC LIMIT 10;

-- 2.4 Liste todos los países que no tienen independencia (hint: ver que define la independencia de un país en la BD).
SELECT Name FROM country WHERE IndepYear IS NULL

-- 2.5 Liste el nombre y el porcentaje de hablantes que tienen todos los idiomas declarados oficiales.
SELECT Languaje, Percentage FROM countrylanguage

-- Adicionales:

-- Actualizar el valor de porcentaje del idioma inglés en el país con código 'AIA' a 100.0

UPDATE countrylanguage SET Percentage = 100.0 WHERE CountryCode = 'AIA'

-- para ver: SELECT * FROM countrylanguage WHERE CountryCode = 'AIA';

-- Listar las ciudades que pertenecen a Córdoba (District) dentro de Argentina

SELECT Name FROM city WHERE District = 'Córdoba'

-- Eliminar todas las ciudades que pertenezcan a Córdoba fuera de Argentina.

DELETE FROM city WHERE District = 'Córdoba' AND CountryCode != 'ARG'

-- Listar los países cuyo Jefe de Estado se llame John.

SELECT Name FROM country WHERE HeadOfState LIKE '%John%'

-- Listar los países cuya población esté entre 35 M y 45 M ordenados por población de forma descendente.

SELECT Name FROM country WHERE Poblacion BETWEEN 35000000 AND 45000000 ORDER BY Poblacion DESC

-- Identificar las redundancias en el esquema final.



-- Practico 3

-- 1.1 Lista el nombre de la ciudad, nombre del país, región y forma de gobierno de las 10 
-- ciudades más pobladas del mundo.

SELECT city.Name, country.Name, country.GovernmentForm, country.Region 
FROM country
JOIN city ON city.CountryCode = country.Code
ORDER BY city.Poblacion DESC LIMIT 10

-- 1.2 Listar los 10 países con menor población del mundo, junto a sus ciudades capitales
-- (Hint: puede que uno de estos países no tenga ciudad capital asignada, en este caso deberá
-- mostrar "NULL").

SELECT country.Name, city.Name FROM country
LEFT JOIN city ON city.ID = country.Capital
ORDER BY country.Poblacion LIMIT 10

-- 1.3 Listar el nombre, continente y todos los lenguajes oficiales de cada país. 
-- (Hint: habrá más de una fila por país si tiene varios idiomas oficiales).

SELECT country.Name, country.Continent, countrylanguage.Languaje
FROM country
JOIN countrylanguage ON countrylanguage.CountryCode = country.Code
WHERE countrylanguage.IsOfficial = 'T'

-- 1.4 Listar el nombre del país y nombre de capital, de los 20 países con mayor superficie del mundo.
SELECT country.Name, city.Name FROM country
JOIN city ON city.ID = country.Capital
ORDER BY country.SurfaceArea DESC LIMIT 20

-- 1.5 Listar las ciudades junto a sus idiomas oficiales (ordenado por la población de la ciudad)
-- y el porcentaje de hablantes del idioma.

SELECT city.Name, countrylanguage.Languaje, countrylanguage.Percentage
FROM city 
JOIN countrylanguage ON countrylanguage.CountryCode = city.CountryCode
WHERE countrylanguage.IsOfficial = 'T' ORDER BY city.Poblacion DESC

-- 1.6 Listar los 10 países con mayor población y los 10 países con menor población
-- (que tengan al menos 100 habitantes) en la misma consulta.

(SELECT Name, Poblacion FROM country WHERE Poblacion > 100 ORDER BY Poblacion ASC LIMIT 10)
UNION ALL
(SELECT Name, Poblacion FROM country ORDER BY Poblacion DESC LIMIT 10)

-- 1.7 Listar aquellos países cuyos lenguajes oficiales son el Inglés y el Francés
-- (hint: no debería haber filas duplicadas).

SELECT DISTINCT country.Name FROM country
JOIN countrylanguage AS cl ON cl.CountryCode = country.Code
WHERE cl.IsOfficial = 'T' AND (cl.Languaje = 'English' OR cl.Languaje = 'French')

-- 1.8 Listar aquellos países que tengan hablantes del Inglés pero no del Español en su población.

(SELECT DISTINCT country.Name FROM country
JOIN countrylanguage AS cl ON cl.CountryCode = country.Code
WHERE cl.Languaje = 'English') 
EXCEPT
(SELECT DISTINCT country.Name FROM country
JOIN countrylanguage AS cl ON cl.CountryCode = country.Code
WHERE cl.Languaje = 'Spanish') 


-- 2.1 ¿Devuelven los mismos valores las siguientes consultas? ¿Por qué? 
(SELECT city.Name, country.Name
FROM city
INNER JOIN country ON city.CountryCode = country.Code AND country.Name = 'Argentina')
EXCEPT
(SELECT city.Name, country.Name
FROM city
INNER JOIN country ON city.CountryCode = country.Code
WHERE country.Name = 'Argentina')

-- 2.2 ¿Y si en vez de INNER JOIN fuera un LEFT JOIN?

(SELECT city.Name, country.Name
FROM city
LEFT JOIN country ON city.CountryCode = country.Code AND country.Name = 'Argentina')
EXCEPT
(SELECT city.Name, country.Name
FROM city
LEFT JOIN country ON city.CountryCode = country.Code
WHERE country.Name = 'Argentina')


(SELECT city.Name, country.Name
FROM city
LEFT JOIN country ON city.CountryCode = country.Code
WHERE country.Name = 'Argentina')
EXCEPT
(SELECT city.Name, country.Name
FROM city
LEFT JOIN country ON city.CountryCode = country.Code AND country.Name = 'Argentina')

-- WHERE se ejecuta despues. Con AND se ejecuta en la bsuqueda del join. WHERE limpia completamente,
-- en cambio con AND, al ejecutar con LEFT JOIN no limplia completamente


-- Practico 4

-- 1.1 Listar el nombre de la ciudad y el nombre del país de todas las ciudades que pertenezcan a
-- países con una población menor a 10000 habitantes.

SELECT city.Name, country.Name
FROM city
JOIN country ON city.CountryCode = country.Code
WHERE country.Poblacion <= 10000

-- 1.2 Listar todas aquellas ciudades cuya población sea mayor que la población promedio
-- entre todas las ciudades.

SELECT Name,Poblacion 
FROM city 
WHERE Poblacion > (SELECT avg(Poblacion) FROM city)


-- 1.3 Listar todas aquellas ciudades no asiáticas cuya población sea igual o mayor a la población
-- total de algún país de Asia.

SELECT Name 
FROM country 
WHERE Continent != 'Asia' AND Poblacion >= 
(SELECT min(Poblacion) FROM country WHERE Continent = 'Asia') 

-- O tambien:

SELECT Name
FROM country
WHERE Continent != 'Asia' AND Poblacion >= SOME 
(SELECT Poblacion FROM country WHERE Continent = 'Asia')

-- 1.4 Listar aquellos países junto a sus idiomas no oficiales, que superen en porcentaje de
-- hablantes a cada uno de los idiomas oficiales del país.

SELECT c.Name, cl.Languaje
FROM country AS c
JOIN countrylanguage AS cl ON cl.CountryCode = c.Code
WHERE cl.IsOfficial = 'F' AND cl.Percentage > ALL
(SELECT Percentage FROM countrylanguage WHERE IsOfficial = 'T' AND CountryCode = cl.CountryCode)

-- 1.5 Listar (sin duplicados) aquellas regiones que tengan países con una superficie menor a 
-- 1000 km2 y exista (en el país) al menos una ciudad con más de 100000 habitantes.
-- (Hint: Esto puede resolverse con o sin una subquery, intenten encontrar ambas respuestas).

SELECT DISTINCT Region
FROM country
JOIN city ON city.CountryCode = country.Code
WHERE country.SurfaceArea < 1000 AND city.Poblacion > 100000

SELECT DISTINCT Region
FROM country
WHERE country.SurfaceArea < 1000 AND EXISTS
(SELECT * FROM city WHERE Poblacion > 100000 AND CountryCode = country.Code)

-- 1.6 Listar el nombre de cada país con la cantidad de habitantes de su ciudad más poblada.
-- (Hint: Hay dos maneras de llegar al mismo resultado. Usando consultas escalares o usando
-- agrupaciones, encontrar ambas).

SELECT Name,
     (SELECT DISTINCT Poblacion
      FROM city
      WHERE country.Code = city.CountryCode AND Poblacion >= ALL 
       (SELECT Poblacion
      	FROM city
      	WHERE country.Code = city.CountryCode)
     ) AS most_population
FROM country;

-- FIXME: FALTA 1 !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

-- 1.7 Listar aquellos países y sus lenguajes no oficiales cuyo porcentaje de hablantes sea mayor al
-- promedio de hablantes de los lenguajes oficiales.

SELECT c.Name, cl.Languaje
FROM country AS c
JOIN countrylanguage AS cl ON c.Code = cl.CountryCode
WHERE cl.IsOfficial = 'F' AND cl.Percentage >
(SELECT avg(Percentage)
FROM countrylanguage AS cl2
WHERE c.Code = cl2.CountryCode AND cl2.IsOfficial = 'T')


-- 1.8 Listar la cantidad de habitantes por continente ordenado en forma descendente.

SELECT DISTINCT Continent, SUM(Poblacion) AS inhabitants
FROM country
GROUP BY Continent
ORDER BY inhabitants DESC

SELECT DISTINCT c1.Continent, 
	(SELECT SUM(Poblacion)
	FROM country AS c2
	WHERE c1.Continent = c2.Continent
	) AS inhabitants
FROM country AS c1 ORDER BY inhabitants DESC

-- 1.9 Listar el promedio de esperanza de vida (LifeExpectancy) por continente con una esperanza de vida
-- entre 40 y 70 años.


-- Herramientas
SELECT * FROM country LIMIT 1;
SELECT DISTINCT IsOfficial FROM countrylanguage;

-- 2 Si en la consulta 6 se quisiera devolver, además de las columnas ya solicitadas,
-- el nombre de la ciudad más poblada. ¿Podría lograrse con agrupaciones? ¿y con una subquery escalar?

SELECT Name,
     (SELECT Name
      FROM city
      WHERE country.Code = city.CountryCode AND Poblacion >= ALL 
       (SELECT Poblacion
      	FROM city
      	WHERE country.Code = city.CountryCode)
      LIMIT 1
     ) AS city,
     (SELECT DISTINCT Poblacion
      FROM city
      WHERE country.Code = city.CountryCode AND Poblacion >= ALL 
       (SELECT Poblacion
      	FROM city
      	WHERE country.Code = city.CountryCode)
     ) AS Poblacion
FROM country;