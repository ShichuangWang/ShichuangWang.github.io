document.addEventListener('DOMContentLoaded', function() {
  if (typeof MathJax !== 'undefined' && MathJax.startup) {
    MathJax.startup.promise.then(() => {
      addCopyButtons();
    });
  } else {
    setTimeout(addCopyButtons, 2000);
  }
});

function addCopyButtons() {
  const containers = document.querySelectorAll('mjx-container');
  
  containers.forEach(function(container) {
    if (container.classList.contains('has-copy-btn')) return;
    container.classList.add('has-copy-btn');
    
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    // 设置 container 为相对定位，但不改变其 display 属性
    const originalPosition = window.getComputedStyle(container).position;
    if (originalPosition === 'static') {
      container.style.position = 'relative';
    }
    
    // 创建复制按钮
    const btn = document.createElement('button');
    btn.innerHTML = '📷';
    btn.title = '复制公式图片';
    btn.className = 'math-copy-btn';
    btn.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      padding: 2px 6px;
      font-size: 12px;
      line-height: 1;
      background: rgba(255,255,255,0.95);
      border: 1px solid #ddd;
      border-radius: 50%;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      pointer-events: none;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // 直接添加到 container 内部
    container.appendChild(btn);
    
    // 悬停效果
    container.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    });
    
    container.addEventListener('mouseleave', () => {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    });
    
    // 点击复制
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      btn.disabled = true;
      btn.innerHTML = '⏳';
      
      try {
        await copySvgAsPng(svg);
        btn.innerHTML = '✓';
        btn.style.background = '#4CAF50';
        btn.style.color = 'white';
        btn.style.borderColor = '#4CAF50';
        
        setTimeout(() => {
          btn.innerHTML = '📷';
          btn.style.background = 'rgba(255,255,255,0.95)';
          btn.style.color = 'inherit';
          btn.style.borderColor = '#ddd';
          btn.disabled = false;
        }, 1500);
      } catch (err) {
        console.error('Copy failed:', err);
        btn.innerHTML = '✗';
        btn.style.background = '#f44336';
        btn.style.color = 'white';
        
        setTimeout(() => {
          btn.innerHTML = '📷';
          btn.style.background = 'rgba(255,255,255,0.95)';
          btn.style.color = 'inherit';
          btn.disabled = false;
        }, 1500);
      }
    });
  });
}

async function copySvgAsPng(svgElement) {
  return new Promise((resolve, reject) => {
    const clonedSvg = svgElement.cloneNode(true);
    
    // 获取尺寸
    const bbox = svgElement.getBBox();
    const width = Math.max(bbox.width, svgElement.width.baseVal.value || 200);
    const height = Math.max(bbox.height, svgElement.height.baseVal.value || 50);
    
    // 设置属性
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // 序列化
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const scale = 3; // 高分辨率
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(async function(blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          URL.revokeObjectURL(url);
          resolve();
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    
    img.src = url;
  });
}

// 添加全局样式
const style = document.createElement('style');
style.textContent = `
  mjx-container {
    transition: background 0.2s;
  }
  mjx-container:hover {
    background: rgba(135, 206, 250, 0.08);
    border-radius: 3px;
  }
  .math-copy-btn:hover {
    transform: scale(1.1);
  }
  .math-copy-btn:active {
    transform: scale(0.95);
  }
`;
document.head.appendChild(style);