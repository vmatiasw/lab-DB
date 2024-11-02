-- Practico 5

SHOW DATABASES;
CREATE DATABASE sakila;
USE sakila;
SHOW TABLES;

-- Consultas

-- 1.1 Cree una tabla de `directors` con las columnas: Nombre, Apellido, Número de Películas.

CREATE TABLE director (
	director_id INT AUTO_INCREMENT,
	Nombre VARCHAR(50) NOT NULL,
	Apellido VARCHAR(50) NOT NULL,
	NumeroPeliculas INT,
	PRIMARY KEY (director_id)
	);

-- 1.2 El top 5 de actrices y actores de la tabla `actors` que tienen la mayor experiencia (i.e. el mayor número de
-- películas filmadas) son también directores de las películas en las que participaron. Basados en esta
-- información, inserten, utilizando una subquery los valores correspondientes en la tabla `directors`.

INSERT INTO director (Nombre, Apellido, NumeroPeliculas)
SELECT a.first_name , a.last_name, COUNT(fa.actor_id) AS num_films
FROM actor AS a
JOIN film_actor AS fa ON a.actor_id = fa.actor_id
GROUP BY a.actor_id
ORDER BY num_films DESC
LIMIT 5

SELECT * FROM director

-- 1.3 Agregue una columna `premium_customer` que tendrá un valor 'T' o 'F' de acuerdo a
-- si el cliente es "premium" o no. Por defecto ningún cliente será premium.

ALTER TABLE customer 
ADD premium_customer ENUM('T', 'F') DEFAULT 'F';

SELECT * FROM customer LIMIT 1

-- 1.4 Modifique la tabla customer. Marque con 'T'; en la columna `premium_customer` de
-- los 10 clientes con mayor dinero gastado en la plataforma.

UPDATE customer -- NO ANDUVO, por?
SET premium_customer  = 'T'
WHERE customer_id IN
(
SELECT c.customer_id , SUM(p.amount) AS gastos, c.premium_customer
FROM customer AS c
JOIN payment AS p ON c.customer_id = p.customer_id
GROUP BY p.customer_id
ORDER BY gastos DESC
LIMIT 10
)

UPDATE customer
JOIN (
    SELECT c.customer_id , SUM(p.amount) AS gastos, c.premium_customer
    FROM customer AS c
    JOIN payment AS p ON c.customer_id = p.customer_id
    GROUP BY c.customer_id
    ORDER BY gastos DESC
    LIMIT 10
) AS top_customers ON customer.customer_id = top_customers.customer_id
SET customer.premium_customer = 'T'

SELECT customer_id, premium_customer
FROM customer
WHERE premium_customer = 'T'

-- 1.5 Listar, ordenados por cantidad de películas (de mayor a menor), los distintos ratings
-- de las películas existentes (Hint: rating se refiere en este caso a la clasificación
-- según edad: G, PG, R, etc).

SELECT f.rating, COUNT(f.film_id) AS numeroPeliculas
FROM film AS f
GROUP BY f.rating
ORDER BY numeroPeliculas DESC

-- 1.6 ¿Cuáles fueron la primera y última fecha donde hubo pagos?

SELECT MIN(p.payment_date) AS firstPayment,  MAX(p.payment_date) AS lastPayment
FROM payment AS p

-- 1.7 Calcule, por cada mes, el promedio de pagos (Hint: vea la manera de extraer el
-- nombre del mes de una fecha).

SELECT DATE_FORMAT(p.payment_date, '%Y-%m') AS mes, AVG(p.amount) AS promedioPagos
FROM payment AS p
GROUP BY mes

-- 1.8 Listar los 10 distritos que tuvieron mayor cantidad de alquileres (con la cantidad total de alquileres).

SELECT a.district, COUNT(r.rental_id) AS numeroAlquileres
FROM address AS a
JOIN customer AS c ON c.address_id = a.address_id
JOIN rental AS r ON c.customer_id = r.customer_id
GROUP BY a.district
ORDER BY numeroAlquileres DESC
LIMIT 10

-- 1.9 Modifique la table `inventory_id` agregando una columna `stock` que sea un número
-- entero y representa la cantidad de copias de una misma película que tiene
-- determinada tienda. El número por defecto debería ser 5 copias.

ALTER TABLE inventory 
ADD stock INT DEFAULT 5


-- 1.10 Cree un trigger `update_stock` que, cada vez que se agregue un nuevo registro a la
-- tabla rental, haga un update en la tabla `inventory` restando una copia al stock de la
-- película rentada (Hint: revisar que el rental no tiene información directa sobre la
-- tienda, sino sobre el cliente, que está asociado a una tienda en particular).

DELIMITER $$
CREATE TRIGGER update_stock AFTER INSERT
ON rental FOR EACH ROW 
BEGIN
    UPDATE inventory
    SET stock = stock - 1
    WHERE inventory_id = NEW.inventory_id;
END $$
DELIMITER ;

SELECT * FROM inventory

SELECT DISTINCT stock
FROM inventory

SELECT *
FROM rental
WHERE (inventory_id, customer_id, staff_id) = (1, 1, 1)

INSERT INTO `rental` (`inventory_id`, `customer_id`, `staff_id`) VALUES (1, 1, 1)

-- 1.11 Cree una tabla `fines` que tenga dos campos: `rental_id` y `amount`. El primero es
-- una clave foránea a la tabla rental y el segundo es un valor numérico con dos decimales.

CREATE TABLE fines (
	fines_id INT AUTO_INCREMENT,
	rental_id INT NOT NULL,
	amount DECIMAL(10, 2) NOT NULL,
	PRIMARY KEY (fines_id),
	FOREIGN KEY (rental_id) REFERENCES rental(rental_id) 
	);

-- 1.12 Cree un procedimiento `check_date_and_fine` que revise la tabla `rental` y cree un
-- registro en la tabla `fines` por cada `rental` cuya devolución (return_date) haya
-- tardado más de 3 días (comparación con rental_date). El valor de la multa será el
-- número de días de retraso multiplicado por 1.5.

-- DELIMITER $$ -- No anda
-- CREATE PROCEDURE check_date_and_fine()
-- BEGIN
-- 	FOR x AS 
-- 		SELECT rental_id, DATEDIFF(return_date, rental_date) AS retraso
-- 		FROM rental
-- 		WHERE DATEDIFF(return_date, rental_date) > 3
-- 	DO
-- 		INSERT INTO fines (rental_id, amount) VALUES (x.rental_id, x.retraso * 1.5)
-- END $$
-- DELIMITER ;

DELIMITER $$
CREATE PROCEDURE check_date_and_fine()
BEGIN
    INSERT INTO fines (rental_id, amount)
    SELECT rental_id, DATEDIFF(return_date, rental_date) * 1.5 AS amount
    FROM rental
    WHERE DATEDIFF(return_date, rental_date) > 3;
END $$
DELIMITER ;

SHOW PROCEDURE STATUS WHERE Db = 'sakila';

CALL check_date_and_fine();

SELECT * FROM fines


-- 1.13 Crear un rol `employee` que tenga acceso de inserción, eliminación y actualización a la tabla `rental`.

CREATE ROLE employee;

GRANT insert, delete, update
ON rental
TO employee;

SHOW GRANTS FOR 'employee';

-- 1.14 Revocar el acceso de eliminación a `employee` y crear un rol `administrator` que
-- tenga todos los privilegios sobre la BD `sakila`.

REVOKE delete
ON rental
FROM employee;

SHOW GRANTS FOR 'employee';

CREATE ROLE administrator;

GRANT ALL PRIVILEGES
ON sekila.*
TO administrator;

SHOW GRANTS FOR 'administrator';

-- 1.15 Crear dos roles de empleado. A uno asignarle los permisos de `employee` y al otro de `administrator`.

CREATE USER 'empleado1'@'localhost' IDENTIFIED BY 'contraseña1';
CREATE USER 'empleado2'@'localhost' IDENTIFIED BY 'contraseña2';

GRANT 'employee' TO 'empleado1'@'localhost';
GRANT 'administrator' TO 'empleado2'@'localhost';

SHOW GRANTS FOR 'empleado1'@'localhost';
SHOW GRANTS FOR 'empleado2'@'localhost';




