import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { Bill, Supplier, loginUser } from './model';
import AppRoutes from './App.routes';
import { AuthProvider } from './model/Auth';

// async function test() {
//   await loginUser('admin@email.com', 'password')
//   await Bill.get('ZBX3VmqjyMbfEnZlK9Ou')

//   await Bill.getAll()

//   const suppliers = await Supplier.getAll()
//   console.log('Suppliers');
//   console.log(suppliers);

//   // await Bill.add({
//   //   supplier_id: "GMdvVwFDXr6DmggD2yhb",
//   //   payment_date: new Date(),
//   //   total_payment: 500,
//   //   payment_status: 'paid',
//   //   payment_type: 'bank',
//   //   payment_bank_id: 'tQNGVCmVi0evkl0aHX5I'
//   // })

//   // await Bill.getAll()
// }

// test()

console.log('App init');

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
