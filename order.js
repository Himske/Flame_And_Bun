(() => {
    const storageKey = 'flame-and-bun-order';
    const addButtons = [...document.querySelectorAll('button')].filter((button) =>
        button.textContent.replace(/\s+/g, ' ').trim().toLowerCase() === 'add to order'
    );

    let order = loadOrder();
    let isOpen = false;

    const widget = document.createElement('div');
    widget.className = 'fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3';
    widget.innerHTML = `
        <section id="order-panel" class="hidden overflow-hidden rounded-2xl border border-orange-100 bg-white text-stone-800 shadow-2xl" aria-labelledby="order-title" aria-hidden="true">
            <div class="p-5">
                <header class="flex items-center justify-between gap-4">
                    <h2 id="order-title" class="text-2xl uppercase text-red-600">Your Order</h2>
                    <button type="button" data-close-order class="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-orange-100 hover:text-stone-800" aria-label="Close order list">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </header>
                <p data-order-empty class="mt-4 text-sm text-stone-600">Your order list is empty.</p>
                <ul data-order-items class="mt-3 max-h-72 divide-y divide-orange-100 overflow-y-auto"></ul>
                <div class="mt-4 flex items-center justify-between border-t border-orange-100 pt-4 font-bold">
                    <span>Subtotal</span>
                    <span data-order-subtotal>$0</span>
                </div>
                <button type="button" data-clear-order class="mt-4 w-full rounded-xl border border-stone-200 py-2 text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40">Clear list</button>
            </div>
        </section>
        <button type="button" data-toggle-order class="flex items-center gap-3 rounded-full bg-red-600 px-5 py-4 font-bold text-white shadow-xl transition hover:bg-red-700" aria-controls="order-panel" aria-expanded="false">
            <i class="fa-solid fa-basket-shopping" aria-hidden="true"></i>
            <span>Order list</span>
            <span data-order-count class="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-sm text-red-600" aria-live="polite">0</span>
        </button>
    `;
    document.body.append(widget);

    const panel = widget.querySelector('#order-panel');
    const toggleButton = widget.querySelector('[data-toggle-order]');
    const closeButton = widget.querySelector('[data-close-order]');
    const clearButton = widget.querySelector('[data-clear-order]');
    const emptyMessage = widget.querySelector('[data-order-empty]');
    const itemsList = widget.querySelector('[data-order-items]');
    const countLabel = widget.querySelector('[data-order-count]');
    const subtotalLabel = widget.querySelector('[data-order-subtotal]');

    panel.style.width = '22rem';
    panel.style.maxWidth = 'calc(100vw - 2.5rem)';
    panel.style.maxHeight = '75vh';

    function loadOrder() {
        try {
            const storedOrder = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (!Array.isArray(storedOrder)) return [];

            return storedOrder.filter((orderItem) =>
                orderItem && typeof orderItem.id === 'string' &&
                typeof orderItem.name === 'string' &&
                Number.isSafeInteger(orderItem.priceCents) && orderItem.priceCents >= 0 &&
                Number.isSafeInteger(orderItem.quantity) && orderItem.quantity > 0
            );
        } catch {
            return [];
        }
    }

    function saveOrder() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(order));
        } catch {
            emptyMessage.textContent = 'Your order list is available for this visit but could not be saved.';
        }
    }

    function formatPrice(priceCents) {
        const dollars = priceCents / 100;
        return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
    }

    function renderOrder() {
        const totalQuantity = order.reduce((total, orderItem) => total + orderItem.quantity, 0);
        const subtotalCents = order.reduce((total, orderItem) =>
            total + orderItem.priceCents * orderItem.quantity, 0
        );

        countLabel.textContent = String(totalQuantity);
        subtotalLabel.textContent = formatPrice(subtotalCents);
        emptyMessage.classList.toggle('hidden', order.length > 0);
        toggleButton.classList.toggle('hidden', order.length === 0);
        if (order.length === 0) setOpen(false);
        itemsList.replaceChildren();
        clearButton.disabled = order.length === 0;

        for (const orderItem of order) {
            const row = document.createElement('li');
            row.className = 'flex items-start justify-between gap-3 py-3';
            row.dataset.orderId = orderItem.id;

            const details = document.createElement('div');
            details.className = 'min-w-0';

            const name = document.createElement('p');
            name.className = 'font-bold';
            name.textContent = orderItem.name;

            const unitPrice = document.createElement('p');
            unitPrice.className = 'mt-1 text-sm text-stone-500';
            unitPrice.textContent = `${formatPrice(orderItem.priceCents)} each`;

            const quantityControls = document.createElement('div');
            quantityControls.className = 'mt-2 flex items-center gap-2';
            quantityControls.append(
                createControlButton('−', 'decrease', `Decrease ${orderItem.name} quantity`)
            );

            const quantity = document.createElement('span');
            quantity.className = 'min-w-6 text-center text-sm font-semibold';
            quantity.textContent = String(orderItem.quantity);
            quantityControls.append(quantity);
            quantityControls.append(
                createControlButton('+', 'increase', `Increase ${orderItem.name} quantity`)
            );

            const itemTotal = document.createElement('p');
            itemTotal.className = 'shrink-0 pt-1 text-right font-bold';
            itemTotal.textContent = formatPrice(orderItem.priceCents * orderItem.quantity);

            details.append(name, unitPrice, quantityControls);
            row.append(details, itemTotal);
            itemsList.append(row);
        }
    }

    function createControlButton(label, action, accessibleName) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 font-bold text-orange-700 transition hover:bg-orange-100';
        button.dataset.orderAction = action;
        button.setAttribute('aria-label', accessibleName);
        button.textContent = label;
        return button;
    }

    function setOpen(open) {
        isOpen = open;
        panel.classList.toggle('hidden', !isOpen);
        panel.setAttribute('aria-hidden', String(!isOpen));
        toggleButton.setAttribute('aria-expanded', String(isOpen));
    }

    function getItemFromButton(button) {
        const sauceRow = button.closest('li');
        let name;
        let priceText;

        if (sauceRow) {
            const labels = sauceRow.querySelectorAll('.flex.justify-between span');
            name = labels[0]?.textContent.trim();
            priceText = labels[1]?.textContent.trim();
        } else {
            const card = button.closest('.burger-card, .menu-card');
            name = card?.querySelector('h3')?.textContent.replace(/\s+/g, ' ').trim();
            priceText = [...(card?.querySelectorAll('span, p') || [])]
                .map((label) => label.textContent.trim())
                .find((label) => /^\$\d+(?:\.\d{1,2})?$/.test(label));
        }

        if (!name || !priceText) return null;
        const priceCents = Math.round(Number(priceText.slice(1)) * 100);
        if (!Number.isSafeInteger(priceCents)) return null;

        return {
            id: `${name.toLowerCase()}-${priceCents}`,
            name,
            priceCents,
        };
    }

    for (const addButton of addButtons) {
        addButton.addEventListener('click', () => {
            const selectedItem = getItemFromButton(addButton);
            if (!selectedItem) return;

            const existingItem = order.find((orderItem) => orderItem.id === selectedItem.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                order.push({ ...selectedItem, quantity: 1 });
            }

            saveOrder();
            renderOrder();
        });
    }

    itemsList.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-order-action]');
        const row = actionButton?.closest('[data-order-id]');
        if (!actionButton || !row) return;

        const selectedItem = order.find((orderItem) => orderItem.id === row.dataset.orderId);
        if (!selectedItem) return;

        if (actionButton.dataset.orderAction === 'increase') {
            selectedItem.quantity += 1;
        } else {
            selectedItem.quantity -= 1;
            if (selectedItem.quantity === 0) {
                order = order.filter((orderItem) => orderItem.id !== selectedItem.id);
            }
        }

        saveOrder();
        renderOrder();
    });

    toggleButton.addEventListener('click', () => setOpen(!isOpen));
    closeButton.addEventListener('click', () => setOpen(false));
    clearButton.addEventListener('click', () => {
        order = [];
        saveOrder();
        renderOrder();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen) setOpen(false);
    });

    renderOrder();
})();