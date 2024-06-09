// Globel Product add to cart data array variable
let items_array = [];
// ATC Class
class CartItem {
  constructor(id, qty, properties) {
    this.id = id;
    this.quantity = qty;
    this.properties = properties;
  }
  addToItemsArray() {
    for (let i = 0; i < items_array.length; i++) {
      if (this.id == items_array[i].id) {
        return;
      }
    }
    items_array.push(this);
  }
}

// Product Handler
const popupExtension = {
  init: function () {
    this.popUpTrigger();
    this.dropDownOpen();
  },
  popUpTrigger: function() {
    let triggers = document.querySelectorAll(".popup-trigger");
    let closeButton = document.querySelector(".close-button");
    triggers.forEach(trigger => {
      trigger.addEventListener("click", this.toggleModal.bind(this));
    });
    closeButton.addEventListener("click", this.toggleModal.bind(this));
    window.addEventListener("click", this.windowOnClick.bind(this));
  },
  getProduct: async function (el) {
    const productHandle = el.getAttribute('data-handle');
    console.log('Product Handle:', productHandle);

    try {
      const response = await fetch(`/products/${productHandle}.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      const productData = await response.json();
      const product = productData.product;
      // Update modal content
      document.querySelector('.pro-info').setAttribute('data-variants', JSON.stringify(product.variants));
      document.querySelector('.pro-media img').src = product.images[0].src;
      document.querySelector('.pro-info .pro-title').innerText = product.title;
      document.querySelector('.pro-price').innerText = `${product.variants[0].price}€`;
      document.querySelector('.pro-info .pro-decstiption').innerHTML = product.body_html;
      // Update variants
      const colorOptions = product.options.find(option => option.name === 'Color');
      const colorContainer = document.querySelector('.varient-switch-row');
      colorContainer.innerHTML = '';
      colorOptions.values.forEach(value => {
          const switchHolder = document.createElement('div');
          switchHolder.classList.add('switch-holder');
          switchHolder.innerHTML = `
            <input type="radio" id="${value.toLowerCase()}" value="${value}" name="color">
            <label for="${value.toLowerCase()}" class="${value.toLowerCase()}">${value}</label>
          `;
          colorContainer.appendChild(switchHolder);
      });
      const sizeOptions = product.options.find(option => option.name === 'Size');
      const sizeContainer = document.querySelector('.dropdown-list');
      sizeContainer.innerHTML = ''; // Clear existing options
      sizeOptions.values.forEach(value => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `${value}`;
          sizeContainer.appendChild(listItem);
      });
      this.dropDownOptions();
      this.varinatOptions();
      this.addToCart();
    } catch (error) {
        console.error('Error fetching product data:', error);
    }
  },
  toggleModal: function(event) {
    let modal = document.querySelector(".modal-wrapper");
    this.getProduct(event.currentTarget);
    modal.classList.toggle("show-modal");
  },
  windowOnClick: function(event) {
    let modal = document.querySelector(".modal-wrapper");
    if (event.target === modal) {
      this.toggleModal(event);
    }
  },
  dropDownOpen: function() {
    // Custom Dropdown 
    const dropdownWrapper = document.querySelector('#dropdown-wrapper');
    // Event listener to toggle dropdown
    dropdownWrapper.addEventListener('click', function(event) {
      if (event.target.closest('.dropdown-wrapper')) {
        console.log('Dropdown clicked');
        this.classList.toggle('is-active');
      }
    });
  },
  dropDownOptions: function() {
    // Event listener for dropdown items
    const dropdownWrapper = document.querySelector('#dropdown-wrapper');
    const links = document.querySelectorAll('.dropdown-list li');
    const span = document.querySelector('#dropdown-wrapper .selected-size');
    links.forEach(el => el.addEventListener('click', function(event) {
      console.log('Selected text:', event.currentTarget.textContent);
      span.innerHTML = event.currentTarget.textContent;
      dropdownWrapper.classList.remove('is-active'); // Close the dropdown after selection
    }));
  },
  getSelectedColor: function() {
    const selectedColor = document.querySelector('input[name="color"]:checked');
    if (selectedColor) {
      return selectedColor.value;
    } else {
      return null;
    }
  },
  updateVariantId: function() {
    const selectedColor = this.getSelectedColor();
    const selectedSize = document.querySelector('#dropdown-wrapper .selected-size').innerText;
    const variants = JSON.parse(document.querySelector('.pro-info').getAttribute('data-variants'));
    let variantId = null;
    console.log('selectedColor', selectedColor);
    console.log('selectedSize', selectedSize);
    if (selectedColor && selectedSize !== 'Choose your size') {
      console.log('both');
      console.log('variants', variants);
      for (let i = 0; i < variants.length; i++) {
        console.log('variants[i].option1', variants[i].option1);
        console.log('variants[i].option2', variants[i].option2);
        if (variants[i].option1 === selectedSize && variants[i].option2 === selectedColor) {
          console.log('Color found');
          variantId = variants[i].id;
          break;
        }
      }
    }
    const atcBtn = document.querySelector('.add-to-cart-cta .btn');
    if (variantId) {
      atcBtn.setAttribute('data-variant-id', variantId);
    } else {
      atcBtn.removeAttribute('data-variant-id');
    }
    console.log('Selected variant ID:', variantId);
  },
  varinatOptions: function () {
    console.log('Init');
    // Event listeners for color radio buttons
    const colorOptions = document.querySelectorAll('input[name="color"]');
    colorOptions.forEach(option => {
      option.addEventListener('change', () => {
        this.updateVariantId();
      });
    });
  },
  addToCart: function() {
    const atcBtn = document.querySelector('.add-to-cart-cta .btn');
    atcBtn.addEventListener('click', async () => {
      const variantId = atcBtn.getAttribute('data-variant-id');
      if (!variantId) {
        alert('Please select a variant');
        return;
      }
      const quantity = 1; // Assuming a quantity of 1 for simplicity
      const properties = {}; // Add any properties if needed

      const cartItem = new CartItem(variantId, quantity, properties);
      cartItem.addToItemsArray();

      // Make AJAX request to add the item to Shopify cart
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: variantId,
            quantity: quantity,
            properties: properties
          })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const cartData = await response.json();
        console.log('Item added to cart:', cartData);
        window.location.replace('/cart');
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
      console.log('Cart Items:', items_array);
    });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  popupExtension.init();
});

