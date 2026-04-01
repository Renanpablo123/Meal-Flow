// ==========================================
// MEALFLOW - MINI FRAMEWORK INDEXEDDB
// ==========================================

const DB_NAME = "MealFlowDB";
const DB_VERSION = 1; 
let dbInstance = null;

/**
 * 1. INICIAR BANCO DE DADOS
 * Cria o banco e as tabelas (Object Stores) mapeadas no projeto.
 */
function iniciarDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Erro ao abrir IndexedDB:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            console.log(`Banco ${DB_NAME} (v${DB_VERSION}) iniciado com sucesso!`);
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log("Configurando/Atualizando tabelas do IndexedDB...");

            // 1. Tabela de Restaurantes (Dados do Estabelecimento)
            if (!db.objectStoreNames.contains("restaurantes")) {
                const store = db.createObjectStore("restaurantes", { keyPath: "id", autoIncrement: true });
                store.createIndex("idx_status", "status", { unique: false }); // Para buscar pendentes/ativos
            }

            // 2. Tabela de Usuários (Super Admin, Donos, Garçons, Cozinheiros, Visitantes)
            if (!db.objectStoreNames.contains("usuarios")) {
                const store = db.createObjectStore("usuarios", { keyPath: "id", autoIncrement: true });
                store.createIndex("idx_email", "email", { unique: true }); // Login
                store.createIndex("idx_restaurante", "restauranteId", { unique: false }); // Relacionar func. ao rest.
            }

            // 3. Tabela de Categorias do Cardápio (Entradas, Bebidas, etc)
            if (!db.objectStoreNames.contains("categorias")) {
                const store = db.createObjectStore("categorias", { keyPath: "id", autoIncrement: true });
                store.createIndex("idx_restaurante", "restauranteId", { unique: false });
            }

            // 4. Tabela de Produtos (O Cardápio e Estoque)
            if (!db.objectStoreNames.contains("produtos")) {
                const store = db.createObjectStore("produtos", { keyPath: "id", autoIncrement: true });
                store.createIndex("idx_restaurante", "restauranteId", { unique: false });
                store.createIndex("idx_categoria", "categoriaId", { unique: false });
            }

            // 5. Tabela de Pedidos (O fluxo principal)
            if (!db.objectStoreNames.contains("pedidos")) {
                const store = db.createObjectStore("pedidos", { keyPath: "id", autoIncrement: true });
                store.createIndex("idx_restaurante", "restauranteId", { unique: false });
                store.createIndex("idx_status", "status", { unique: false }); // Para a Cozinha e Garçom filtrarem
            }
        };
    });
}

/**
 * 2. ADICIONAR ITEM (Create)
 */
async function adicionarItem(storeName, item) {
    const db = await iniciarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => resolve(request.result); 
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 3. BUSCAR TODOS OS ITENS (Read)
 */
async function buscarTodos(storeName) {
    const db = await iniciarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 4. BUSCAR POR ÍNDICE (Filtro Específico)
 * Ex: buscarPorIndice('pedidos', 'idx_status', 'aguardando_preparo')
 */
async function buscarPorIndice(storeName, indexName, valorBusca) {
    const db = await iniciarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(valorBusca);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 5. ATUALIZAR ITEM (Update)
 */
async function atualizarItem(storeName, itemAtualizado) {
    const db = await iniciarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(itemAtualizado); 

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * 6. DELETAR ITEM (Delete)
 */
async function deletarItem(storeName, id) {
    const db = await iniciarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Inicialização automática
iniciarDB();
