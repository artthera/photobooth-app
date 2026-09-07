/**
 * Photobooth Pro - Categorized Sticker System
 * Features: Categories (Wedding, Birthday, Fun, Corporate), Touch & Drag gesture, Canvas Baking
 */
window.StickerManager = (function(){
  let stickers = []; // Array of active sticker objects: { id, el, x, y, emoji, size }
  let overlayEl = null;

  const categories = {
    fun: {
      name: "😎 Fun / Party",
      stickers: ["🕶️", "🥸", "🤠", "🔥", "🤩", "💋", "🌸", "⚡", "🎸", "🍕", "✨", "❤️"]
    },
    wedding: {
      name: "💍 Wedding",
      stickers: ["💍", "👰", "🤵", "💐", "🥂", "🕊️", "💖", "🍰", "💌", "✨", "🎀", "🌹"]
    },
    birthday: {
      name: "🎂 Birthday",
      stickers: ["🎂", "🎈", "🎁", "🎉", "🥳", "👑", "🦄", "🍬", "🎊", "🌟", "⭐", "🍾"]
    },
    corporate: {
      name: "💼 Formal / Event",
      stickers: ["👔", "🏆", "🤝", "💼", "⭐", "🚀", "📈", "🎓", "🏅", "🎯", "🥇", "✨"]
    }
  };

  let activeCategory = 'fun';

  function init(overlayElement, drawerListElement, categoryTabsElement){
    overlayEl = overlayElement;
    renderCategories(categoryTabsElement, drawerListElement);
    renderStickerList(drawerListElement);
  }

  function renderCategories(tabsEl, listEl){
    if(!tabsEl) return;
    tabsEl.innerHTML = '';

    for(const key in categories){
      const btn = document.createElement('button');
      btn.className = 'category-tab' + (key === activeCategory ? ' active' : '');
      btn.textContent = categories[key].name;
      btn.onclick = () => {
        activeCategory = key;
        tabsEl.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderStickerList(listEl);
      };
      tabsEl.appendChild(btn);
    }
  }

  function renderStickerList(listEl){
    if(!listEl) return;
    listEl.innerHTML = '';

    const list = categories[activeCategory].stickers;
    list.forEach(emoji => {
      const item = document.createElement('span');
      item.className = 'sticker-item';
      item.textContent = emoji;
      item.onclick = () => addSticker(emoji);
      listEl.appendChild(item);
    });
  }

  function addSticker(emoji){
    if(!overlayEl) return;
    if(stickers.length >= (window.PhotoboothConfig?.limits?.maxStickersPerSession || 25)){
      alert("Maksimal stiker tercapai untuk sesi ini.");
      return;
    }

    const id = 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const el = document.createElement('div');
    el.className = 'draggable-sticker selected';
    el.id = id;
    el.innerHTML = `
      <span class="sticker-content">${emoji}</span>
      <button class="btn-del-sticker" title="Hapus">✕</button>
    `;

    const rect = overlayEl.getBoundingClientRect();
    const initX = (rect.width / 2) - 25;
    const initY = (rect.height / 2) - 25;

    el.style.left = initX + 'px';
    el.style.top = initY + 'px';

    overlayEl.appendChild(el);

    const stickerObj = { id, el, x: initX, y: initY, emoji };
    stickers.push(stickerObj);

    setupDraggable(stickerObj);

    el.querySelector('.btn-del-sticker').addEventListener('click', (e) => {
      e.stopPropagation();
      removeSticker(id);
    });
  }

  function removeSticker(id){
    const idx = stickers.findIndex(s => s.id === id);
    if(idx !== -1){
      stickers[idx].el.remove();
      stickers.splice(idx, 1);
    }
  }

  function reset(){
    if(overlayEl) overlayEl.innerHTML = '';
    stickers = [];
  }

  function setupDraggable(sObj){
    const el = sObj.el;
    let isDragging = false;
    let startX, startY;
    let elemStartX, elemStartY;

    function onPointerDown(e){
      stickers.forEach(s => s.el.classList.remove('selected'));
      el.classList.add('selected');

      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;

      elemStartX = parseFloat(el.style.left) || 0;
      elemStartY = parseFloat(el.style.top) || 0;

      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e){
      if(!isDragging) return;
      if(e.cancelable) e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      const newX = elemStartX + dx;
      const newY = elemStartY + dy;

      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      sObj.x = newX;
      sObj.y = newY;
    }

    function onPointerUp(){
      isDragging = false;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    }

    el.addEventListener('mousedown', onPointerDown);
    el.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  /**
   * Bake all stickers onto a canvas preserving proportional high-resolution scaling
   */
  function bakeToCanvas(sourceCanvas){
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = sourceCanvas.width;
    finalCanvas.height = sourceCanvas.height;
    const ctx = finalCanvas.getContext('2d');

    // Draw base strip
    ctx.drawImage(sourceCanvas, 0, 0);

    if(overlayEl && stickers.length > 0){
      const overlayRect = overlayEl.getBoundingClientRect();
      if(overlayRect.width > 0){
        const scaleRatio = finalCanvas.width / overlayRect.width;

        stickers.forEach(stk => {
          const posX = stk.x * scaleRatio;
          const posY = stk.y * scaleRatio;
          const fontSize = 48 * scaleRatio;

          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(stk.emoji, posX, posY);
        });
      }
    }

    return finalCanvas;
  }

  return {
    init,
    reset,
    addSticker,
    bakeToCanvas
  };
})();
