const fs = require('fs');
const path = require('path');

const dirs = [path.join(__dirname, 'pages'), path.join(__dirname, 'components'), path.join(__dirname, 'src')];

const jargonMap = {
  'SlidePanel': 'PopupModal',
  'isSlidePanelOpen': 'isPopupOpen',
  'setIsSlidePanelOpen': 'setIsPopupOpen',
  'handleOpenSlidePanel': 'handleOpenPopup',
  'Logical Designation': 'Name',
  'Functional Parameters': 'Description',
  '<button type="submit" className="flex-[2] text-[#281C59] font-bold text-[14px] uppercase tracking-widest hover:text-[#281C59]">{editingCategory ? "AUTHORIZE UPDATES" : "AUTHORIZE CLUSTER"}</button>': '<Button type="submit" variant="primary" className="flex-[2] py-4">{editingCategory ? "Update Category" : "Save Category"}</Button>',
  '<button type="button" onClick={() => setIsPopupOpen(false)} className="flex-[1] text-[#DB1A1A] font-bold text-[14px] uppercase tracking-widest hover:text-[#DB1A1A]">ABORT</button>': '<Button type="button" variant="danger" onClick={() => setIsPopupOpen(false)} className="flex-[1] py-4">Cancel</Button>',
  '<button type="submit" className="flex-[2] text-[#281C59] font-bold text-[14px] uppercase tracking-widest hover:text-[#281C59]">{editingProduct ? "AUTHORIZE UPDATES" : "AUTHORIZE INDUCTION"}</button>': '<Button type="submit" variant="primary" className="flex-[2] py-4">{editingProduct ? "Update Product" : "Save Product"}</Button>',
  '<button type="submit" className="flex-[2] text-[#281C59] font-bold text-[14px] uppercase tracking-widest hover:text-[#281C59]">{editingUser ? "AUTHORIZE UPDATES" : "INITIALIZE ACCOUNT"}</button>': '<Button type="submit" variant="primary" className="flex-[2] py-4">{editingUser ? "Update User" : "Create User"}</Button>',
  'New Asset (Alt+N)': 'Add Product (Alt+N)',
  'Asset Nomenclature...': 'Product Name...',
  'Initialize Node': 'Create New',
  'AUTHORIZE UPDATES': 'UPDATE',
  'AUTHORIZE CLUSTER': 'SAVE CATEGORY',
  'AUTHORIZE INDUCTION': 'SAVE PRODUCT',
  'ABORT': 'CANCEL',
  'INITIALIZE ACCOUNT': 'CREATE ACCOUNT'
};

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace plain button markup with Button component markup
  content = content.replace(/<button type="submit"[^>]*>\{editingCategory \? "AUTHORIZE UPDATES" : "AUTHORIZE CLUSTER"\}<\/button>/g, '<Button type="submit" variant="primary" className="flex-[2] py-4">{editingCategory ? "Update Category" : "Save Category"}</Button>');
  content = content.replace(/<button type="button" onClick=\{\(\) => setIsPopupOpen\(false\)\}[^>]*>ABORT<\/button>/g, '<Button type="button" variant="danger" onClick={() => setIsPopupOpen(false)} className="flex-[2] py-4">Cancel</Button>');
  content = content.replace(/<button type="submit"[^>]*>\{editingProduct \? "AUTHORIZE UPDATES" : "AUTHORIZE INDUCTION"\}<\/button>/g, '<Button type="submit" variant="primary" className="flex-[2] py-4">{editingProduct ? "Update Product" : "Save Product"}</Button>');
  content = content.replace(/<button type="submit"[^>]*>\{editingUser \? "AUTHORIZE UPDATES" : "INITIALIZE ACCOUNT"\}<\/button>/g, '<Button type="submit" variant="primary" className="flex-[2] py-4">{editingUser ? "Update User" : "Create User"}</Button>');
  
  for (const [jargon, simple] of Object.entries(jargonMap)) {
    content = content.split(jargon).join(simple);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', filePath);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

for (const dir of dirs) {
  walkDir(dir);
}

const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) processFile(appPath);
