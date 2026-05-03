// State Management
let allProducts = [];
let currentPage = 1;
let currentCategory = 'all';
let searchQuery = '';
let isLoading = false;
let hasNextPage = true;

const API_BASE_URL = 'https://api.freeapi.app/api/v1/public/randomproducts';

// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadingMoreIndicator = document.getElementById('loadingMoreIndicator');
const noResults = document.getElementById('noResults');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const skeletonTemplate = document.getElementById('skeletonTemplate');

// --- Core Logic ---

async function fetchProducts(page = 1, isAppend = false) {
    if (isLoading) return;
    
    isLoading = true;
    toggleLoading(true, isAppend);
    errorState.classList.add('hidden');
    noResults.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}?page=${page}&limit=12`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const json = await response.json();
        
        if (!json?.data?.data) {
            throw new Error('Invalid data format received');
        }

        const newProducts = json.data.data;
        hasNextPage = json.data.hasNextPage || false;

        if (isAppend) {
            allProducts = [...allProducts, ...newProducts];
        } else {
            allProducts = newProducts;
        }

        updateCategories();
        renderFilteredProducts();
        
        loadMoreBtn.classList.toggle('hidden', !hasNextPage);
        currentPage = page;

    } catch (error) {
        console.error('Fetch error:', error);
        if (!isAppend) {
            errorMessage.textContent = error.message;
            errorState.classList.remove('hidden');
            productGrid.innerHTML = '';
        }
    } finally {
        isLoading = false;
        toggleLoading(false, isAppend);
    }
}

function filterProducts(products, query, category) {
    return products.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(query.toLowerCase());
        const matchCat = category === 'all' || p.category === category;
        return matchSearch && matchCat;
    });
}

function renderFilteredProducts() {
    const filtered = filterProducts(allProducts, searchQuery, currentCategory);
    
    if (filtered.length === 0 && !isLoading) {
        noResults.classList.remove('hidden');
        productGrid.innerHTML = '';
    } else {
        noResults.classList.add('hidden');
        productGrid.innerHTML = filtered.map(product => createProductCard(product)).join('');
    }
}

function createProductCard(product) {
    return `
        <div class="product-card rounded-lg overflow-hidden flex flex-col h-full">
            <div class="aspect-square w-full bg-white p-4 flex items-center justify-center">
                <img src="${product.thumbnail}" alt="${product.title}" class="max-h-full max-w-full object-contain">
            </div>
            <div class="p-4 flex flex-col flex-grow">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">${product.category}</span>
                <h3 class="text-gray-900 font-medium line-clamp-2 mb-2 h-12">${product.title}</h3>
                
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex">${renderStars(product.rating.rate)}</div>
                    <span class="text-xs text-gray-400">(${product.rating.count})</span>
                </div>

                <div class="mt-auto">
                    <p class="text-xl font-bold text-gray-900 mb-4">$${product.price.toFixed(2)}</p>
                    <button onclick="handleAddToCart(this)" 
                        class="w-full bg-black text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition active:scale-[0.98]">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderStars(rate) {
    return Array.from({length: 5}, (_, i) =>
        `<span style="color:${i < Math.round(rate) ? '#f59e0b' : '#d1d5db'}">★</span>`
    ).join('');
}

function updateCategories() {
    const categories = ['all', ...new Set(allProducts.map(p => p.category))];
    
    // Preserve existing "All" button or clear and rebuild
    categoryFilters.innerHTML = categories.map(cat => `
        <button class="cat-btn px-4 py-2 rounded-full border ${currentCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-700'} text-sm hover:bg-gray-100 hover:text-gray-900 transition capitalize" 
            data-category="${cat}">
            ${cat}
        </button>
    `).join('');

    // Re-attach listeners because we just replaced the HTML
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            updateCategories(); // To update active state
            renderFilteredProducts();
        });
    });
}

function toggleLoading(show, isAppend) {
    if (show) {
        if (isAppend) {
            loadingMoreIndicator.classList.remove('hidden');
            loadMoreBtn.classList.add('hidden');
        } else {
            productGrid.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                productGrid.appendChild(skeletonTemplate.content.cloneNode(true));
            }
        }
    } else {
        loadingMoreIndicator.classList.add('hidden');
    }
}

function handleAddToCart(btn) {
    const originalText = btn.textContent;
    btn.textContent = 'Added!';
    btn.classList.remove('bg-black');
    btn.classList.add('bg-green-600');
    btn.disabled = true;

    setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-black');
        btn.disabled = false;
    }, 1500);
}

// --- Event Listeners ---

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFilteredProducts();
});

loadMoreBtn.addEventListener('click', () => {
    fetchProducts(currentPage + 1, true);
});

retryBtn.addEventListener('click', () => {
    fetchProducts(1, false);
});

// Initialize
fetchProducts();
