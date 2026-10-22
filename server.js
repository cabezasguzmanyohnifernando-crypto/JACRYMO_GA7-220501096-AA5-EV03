
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

const carpetaDatos = path.join(__dirname, 'data');

if (!fs.existsSync(carpetaDatos)) {
    fs.mkdirSync(carpetaDatos);
}

// Funciones reutilizables para almacenar y consultar datos
function leerDatos(nombreArchivo) {
    const ruta = path.join(carpetaDatos, nombreArchivo);

    if (!fs.existsSync(ruta)) {
        fs.writeFileSync(ruta, '[]');
    }

    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function guardarDatos(nombreArchivo, datos) {
    const ruta = path.join(carpetaDatos, nombreArchivo);
    fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
}

function siguienteId(registros) {
    return registros.length
        ? Math.max(...registros.map(r => r.id)) + 1
        : 1;
}

// Validar errores de datos JSON
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400) {
        return res.status(400).json({
            error: 'El cuerpo de la solicitud contiene JSON inválido'
        });
    }

    next(error);
});

// Servicio de inicio
app.get('/', (req, res) => {
    res.status(200).json({
        mensaje: 'API REST de JACRYMO funcionando correctamente',
        proyecto: 'Sistema de Gestión de Ventas y Control de Inventario',
        version: '1.0.0'
    });
});

// ==================== PRODUCTOS ====================

// Consultar todos los productos
app.get('/api/productos', (req, res) => {
    res.json(leerDatos('productos.json'));
});

// Consultar un producto por su ID
app.get('/api/productos/:id', (req, res) => {
    const producto = leerDatos('productos.json')
        .find(p => p.id === Number(req.params.id));

    if (!producto) {
        return res.status(404).json({
            error: 'Producto no encontrado'
        });
    }

    res.json(producto);
});

// Registrar un producto
app.post('/api/productos', (req, res) => {
    const { nombre, precio, cantidadInventario } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({
            error: 'El nombre del producto es obligatorio'
        });
    }

    if (precio === undefined || precio === null ||
        precio === '' || !Number.isFinite(Number(precio)) ||
        Number(precio) <= 0) {
        return res.status(400).json({
            error: 'El precio debe ser un número mayor que cero'
        });
    }

    if (cantidadInventario === undefined ||
        cantidadInventario === null ||
        cantidadInventario === '' ||
        !Number.isInteger(Number(cantidadInventario)) ||
        Number(cantidadInventario) < 0) {
        return res.status(400).json({
            error: 'La cantidad debe ser un entero igual o mayor que cero'
        });
    }

    const productos = leerDatos('productos.json');

    const producto = {
        id: siguienteId(productos),
        nombre: nombre.trim(),
        precio: Number(precio),
        cantidadInventario: Number(cantidadInventario)
    };

    productos.push(producto);
    guardarDatos('productos.json', productos);

    res.status(201).json({
        mensaje: 'Producto registrado correctamente',
        producto
    });
});

// Actualizar un producto
app.put('/api/productos/:id', (req, res) => {
    const productos = leerDatos('productos.json');
    const indice = productos.findIndex(
        p => p.id === Number(req.params.id)
    );

    if (indice === -1) {
        return res.status(404).json({
            error: 'Producto no encontrado'
        });
    }

    const { nombre, precio, cantidadInventario } = req.body;

    if (nombre !== undefined &&
        (typeof nombre !== 'string' || !nombre.trim())) {
        return res.status(400).json({
            error: 'El nombre no puede estar vacío'
        });
    }

    if (precio !== undefined &&
        (precio === '' || !Number.isFinite(Number(precio)) ||
        Number(precio) <= 0)) {
        return res.status(400).json({
            error: 'El precio debe ser mayor que cero'
        });
    }

    if (cantidadInventario !== undefined &&
        (cantidadInventario === '' ||
        !Number.isInteger(Number(cantidadInventario)) ||
        Number(cantidadInventario) < 0)) {
        return res.status(400).json({
            error: 'La cantidad debe ser un entero no negativo'
        });
    }

    productos[indice] = {
        ...productos[indice],
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(precio !== undefined && { precio: Number(precio) }),
        ...(cantidadInventario !== undefined && {
            cantidadInventario: Number(cantidadInventario)
        })
    };

    guardarDatos('productos.json', productos);

    res.json({
        mensaje: 'Producto actualizado correctamente',
        producto: productos[indice]
    });
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const productos = leerDatos('productos.json');
    const filtrados = productos.filter(
        p => p.id !== Number(req.params.id)
    );

    if (filtrados.length === productos.length) {
        return res.status(404).json({
            error: 'Producto no encontrado'
        });
    }

    guardarDatos('productos.json', filtrados);

    res.json({
        mensaje: 'Producto eliminado correctamente'
    });
});

// ==================== CLIENTES ====================

// Consultar clientes
app.get('/api/clientes', (req, res) => {
    res.json(leerDatos('clientes.json'));
});

// Registrar cliente
app.post('/api/clientes', (req, res) => {
    const { nombre, correo, telefono } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({
            error: 'El nombre del cliente es obligatorio'
        });
    }

    if (typeof correo !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
        return res.status(400).json({
            error: 'Ingrese un correo electrónico válido'
        });
    }

    const clientes = leerDatos('clientes.json');

    if (clientes.some(c =>
        c.correo.toLowerCase() === correo.trim().toLowerCase())) {
        return res.status(409).json({
            error: 'El correo ya está registrado'
        });
    }

    const cliente = {
        id: siguienteId(clientes),
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefono || ''
    };

    clientes.push(cliente);
    guardarDatos('clientes.json', clientes);

    res.status(201).json({
        mensaje: 'Cliente registrado correctamente',
        cliente
    });
});

// ==================== INVENTARIO ====================

// Consultar existencias
app.get('/api/inventario', (req, res) => {
    res.json(leerDatos('productos.json').map(p => ({
        id: p.id,
        producto: p.nombre,
        cantidadDisponible: p.cantidadInventario
    })));
});

// Actualizar existencias
app.patch('/api/inventario/:id', (req, res) => {
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null ||
        cantidad === '' || !Number.isInteger(Number(cantidad)) ||
        Number(cantidad) < 0) {
        return res.status(400).json({
            error: 'La cantidad debe ser un entero no negativo'
        });
    }

    const productos = leerDatos('productos.json');
    const producto = productos.find(
        p => p.id === Number(req.params.id)
    );

    if (!producto) {
        return res.status(404).json({
            error: 'Producto no encontrado'
        });
    }

    producto.cantidadInventario = Number(cantidad);
    guardarDatos('productos.json', productos);

    res.json({
        mensaje: 'Inventario actualizado correctamente',
        producto
    });
});

// ==================== VENTAS ====================

// Consultar ventas
app.get('/api/ventas', (req, res) => {
    res.json(leerDatos('ventas.json'));
});

// Registrar una venta y descontar inventario
app.post('/api/ventas', (req, res) => {
    const { productoId, cantidad } = req.body;

    if (!Number.isInteger(Number(productoId)) ||
        Number(productoId) <= 0 ||
        productoId === undefined || productoId === null) {
        return res.status(400).json({
            error: 'Debe indicar un ID de producto válido'
        });
    }

    if (cantidad === undefined || cantidad === null ||
        cantidad === '' || !Number.isInteger(Number(cantidad)) ||
        Number(cantidad) <= 0) {
        return res.status(400).json({
            error: 'La cantidad vendida debe ser un entero mayor que cero'
        });
    }

    const productos = leerDatos('productos.json');
    const producto = productos.find(
        p => p.id === Number(productoId)
    );

    if (!producto) {
        return res.status(404).json({
            error: 'Producto no encontrado'
        });
    }

    if (producto.cantidadInventario < Number(cantidad)) {
        return res.status(409).json({
            error: 'Inventario insuficiente para realizar la venta'
        });
    }

    const ventas = leerDatos('ventas.json');

    const venta = {
        id: siguienteId(ventas),
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: Number(cantidad),
        precioUnitario: producto.precio,
        total: Number((producto.precio * Number(cantidad)).toFixed(2)),
        fecha: new Date().toISOString()
    };

    producto.cantidadInventario -= Number(cantidad);

    ventas.push(venta);
    guardarDatos('productos.json', productos);
    guardarDatos('ventas.json', ventas);

    res.status(201).json({
        mensaje: 'Venta registrada correctamente',
        venta,
        inventarioRestante: producto.cantidadInventario
    });
});

// Ruta para servicios inexistentes
app.use((req, res) => {
    res.status(404).json({
        error: 'La ruta solicitada no existe'
    });
});

// Manejo general de errores
app.use((error, req, res, next) => {
    console.error(error.message);

    res.status(500).json({
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
