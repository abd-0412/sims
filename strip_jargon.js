const fs = require('fs');
const path = require('path');

const dirs = [path.join(__dirname, 'pages'), path.join(__dirname, 'components'), path.join(__dirname, 'src')];

const jargonMap = {
  'Taxonomy Matrix': 'Categories',
  'Logical classification grid of assets optimized for high-velocity supply chain indexing.': 'Classify and organize your store products.',
  'Update Taxonomy Node': 'Edit Category',
  'Initialize Matrix Cluster': 'Add Category',
  'Sever Node Logic': 'Delete Category',
  'Category Overlay': 'Category Filter',
  'Asset Nomenclature or SKU... (Alt+S)': 'Search by name or SKU... (Alt+S)',
  'Asset Nomenclature': 'Product Name',
  'search records...': 'search by name...',
  'Entity Ledger': 'Transactions',
  'Immutable audit trail of every physical stock transaction within the enterprise ecosystem.': 'View the history of all incoming and outgoing inventory.',
  'All Operations': 'All Transactions',
  'Induction (+)': 'Stock In (+)',
  'Depletion (-)': 'Stock Out (-)',
  'Stock Induction': 'Stock In',
  'Stock Depletion': 'Stock Out',
  'Asset Nominal': 'Product',
  'Rationale': 'Reason',
  'Timestamp & Rationale': 'Date & Reason',
  'Operator Identity': 'User ID',
  'Security Clearance': 'Role',
  'Registry Status': 'Status',
  'Audit Control': 'Actions',
  'System Analytics': 'Reports',
  'End-to-end analytical matrix of global inventory valuation and throughput dynamics.': 'View inventory valuation, potential profit, and stock alerts.',
  'Global Data Export...': 'Export Data...',
  'Inventory Master': 'Product List',
  'Logistics Ledger': 'Transaction Log',
  'Total Inducted Worth': 'Total Inventory Value',
  'Projected Equity Delta': 'Potential Profit',
  'Exceptions Found': 'Low Stock Alerts',
  'Depleted Stock Matrix': 'Low Stock Items',
  'CRITICAL THRESHOLDS': 'CRITICAL',
  'Temporal Audit Feed': 'Recent Transactions',
  'LIVE FLOW': 'RECENT',
  'Admin Control Unit': 'User Management',
  'Manage secure access parameters, operator roles, and system clearance levels.': 'Manage employee access, roles, and accounts.',
  'Temporal Audit Stream': 'Audit Logs',
  'Immutable security ledger mapping every atomic event and state shift in the manifold.': 'Track all user actions and system changes.',
  'Temporal Anchor': 'Date',
  'Logical Event': 'Action',
  'Subject Operator': 'User',
  'System Rationale': 'Details',
  'Asset Valuation': 'Category Value',
  'Exceptions Queue': 'Alerts',
  'Operator Control': 'Users',
  'Kill Session': 'Logout',
  'Operator Link': 'Profile',
  'Initialize Terminal Session': 'Login',
  'Induction Protocol': 'Stock Inbound',
  'Depletion Protocol': 'Stock Outbound',
  'Physical stock realization phase. Log items entering the facility manifold.': 'Record incoming products to the warehouse.',
  'Physical stock extraction phase. Log items departing the facility manifold.': 'Record outgoing products dispatched from the warehouse.',
  'Scan or search asset registry...': 'Search for products...',
  'Operator Credential (Email)': 'Email',
  'Authentication Key (Password)': 'Password',
  'Protocol Bypass (Simulated Operators)': 'Quick Access Roles',
  'Personnel Profile': 'User Profile',
  'Manage your system identity, security credentials, and review individual operational metrics.': 'Manage your details, change password, and view activity.',
  'Individual Throughput': 'Your Activity',
  'Ledger Entries': 'Transactions',
  'Operator Status': 'Status',
  'Executive Clearance ACTIVE': 'Admin Active',
  'System Access Confirmed': 'Access Active'
};

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [jargon, simple] of Object.entries(jargonMap)) {
    content = content.split(jargon).join(simple);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('De-jargoned', filePath);
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
