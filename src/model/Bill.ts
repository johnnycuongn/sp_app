import { DocumentData, Query, QueryConstraint, QuerySnapshot, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore"
import { auth, billRef, billsColRef, db, storage, storageBillsRef, storageOneBillRef } from "../services/firebase/index"
import { isStringValid } from "../utils/isValid"
import { removeEmpty } from "../utils/object"
import { BankModelInterface, BillModelInterface, BillViewModelInterface, SupplierModelInterface } from "./model"
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage"
import { Supplier } from "./Supplier"
import { Bank } from "./Bank"


export class Bill {

  /**
   * Need to run `_initialize()` at the begining/useEffect first run to use the property, else receive empty
   */
  public static suppliers: SupplierModelInterface[] = []

  /**
   * Need to run `_initialize()` at the begining/useEffect first run to use the property, else receive empty
   */
  public static banks: BankModelInterface[] = []
  
  public static YEAR_INITAL: number = 2023

  /**
   * If you are using Bill class in a component and want lastest data, please use this function to initialize `suppliers` and `banks`
   */
  public static async _initialize(suppliers?: SupplierModelInterface[], banks?: BankModelInterface[]) {
    if (suppliers) {
      this.suppliers = suppliers.length === 0 ? await Supplier.getAll() : suppliers;
    } else {
      this.suppliers = await Supplier.getAll()
    }
    
    if (banks) {
      this.banks = banks.length === 0 ? await Bank.getAll() : banks;
    } else {
      this.banks = await Bank.getAll()
    }

    const year_query = query(billsColRef, where("payment_date", "<=", new Date()), orderBy("payment_date", 'asc'), limit(1));
    const billDocsSnapshot = await getDocs(year_query)
    const bills = this.fromFirebaseSnapshot(billDocsSnapshot)
    if (bills.length !== 0) {
      this.YEAR_INITAL = bills[0].payment_date.getFullYear()
    }
  }

  /**
   * Put this every function that require suppliers and banks
   */
  private static async suppliers_banks_init() {
    if (this.suppliers.length === 0) {
      this.suppliers = await Supplier.getAll()
    } 

    if (this.banks.length === 0) {
      this.banks = await Bank.getAll()
    }
  }

  static async create(bill: BillModelInterface, files: File[]) {
    validateBill(bill, false, true)

    const batch = writeBatch(db)

    let new_bill_id = doc(billsColRef).id
    let postData = bill

    // Process
    delete postData.id

    const validUser = postData.user_id && isStringValid(postData.user_id)
    if (!validUser) {
      if (auth.currentUser) {
        postData.user_id = auth.currentUser.uid
      } else {
        throw new Error(`Invalid user when adding new bill. Date: ${new Date()}`)
      }
    }

    postData.meta = {
      created_at: new Date(),
      updated_at: new Date()
    }

    // - End Process
    
    if (postData.payment_type === 'cash' && isStringValid(postData.payment_bank_id)) {
      delete postData.payment_bank_id
    }
    if (postData.payment_type === 'bank' && !isStringValid(postData.payment_bank_id)) {
      throw new Error('Unable to add bank to bill.')
    }

    let operations = []

    let files_ref: string[] = []

    // Upload images
    files.forEach(file => {
      const billStorageRef = storageOneBillRef(new_bill_id)
      const fileRef = ref(billStorageRef, file.name)


      files_ref.push(fileRef.fullPath)
      operations.push(uploadBytes(fileRef, file))
    })

    postData.files_ref = files_ref
    batch.set(billRef(new_bill_id), postData)
    operations.push(batch.commit())

    await Promise.all(operations)
  }

  static async get(id: string): Promise<BillModelInterface | null> {
    this.suppliers_banks_init()
    const docSnap = await getDoc(billRef(id))

    const data = docSnap.data()
    if (!docSnap.exists()) throw new Error('Unable to fetch Bill ' + id)

    console.log('Get bill', data);

    return this.fromFirebase(docSnap.id, data)
  }

  static getForSupplierInQuarter(supplierId: string, quarter: number): BillModelInterface[] {

    return []
  }

  static async getAllForSupplier(supplierId: string): Promise<BillModelInterface[]> {
    this.suppliers_banks_init()

    if (!supplierId) throw new Error('Invalid supplier!')

    const billQueries: Query = query(
      billsColRef,
      where('supplier_id', '==', supplierId)
    )

    const billDocsSnapshot = await getDocs(billQueries)

    return this.fromFirebaseSnapshot(billDocsSnapshot)
  }

  static async update(billId: string, bill: BillModelInterface, files: File[]) {
    let OPERATIONS = []

    validateBill(bill, true, true)
    console.log('Updating bill', billId);

    if (bill.id) delete bill.id
    bill.meta = {
      created_at: bill.meta && bill.meta.created_at ? bill.meta.created_at : new Date(),
      updated_at: new Date()
    }


    const updatedBill = {
      ...bill
    }

    removeEmpty(updatedBill)

    let files_ref: string[] = []

    // Delete images
    const res = await listAll(storageBillsRef)
    res.items.forEach(fileRef => {
      OPERATIONS.push(deleteObject(fileRef))
    })

    // Upload images
    files.forEach(file => {
      const billStorageRef = storageOneBillRef(billId)
      const fileRef = ref(billStorageRef, file.name)

      files_ref.push(fileRef.fullPath)
      OPERATIONS.push(uploadBytes(fileRef, file))
    })

    updatedBill.files_ref = files_ref
    OPERATIONS.push(updateDoc(billRef(billId), updatedBill))
    try {
      console.log('Data', updatedBill);
      await Promise.all(OPERATIONS)
    } catch (e) {
      throw new Error('Unable to update bill' + billId)
    }
  }

  static async delete(billId: string) {
    if (!isStringValid(billId)) throw new Error('Invalid bill.')

    let deleteOperations = []
    deleteOperations.push(deleteDoc(billRef(billId)))

    try {
      await Promise.all(deleteOperations)
    } catch (e) {
      throw new Error('Unable to delete bill ' + billId)
    }
  }


  static async getAll(...billQuery: QueryConstraint[]): Promise<BillViewModelInterface[]> {
    this.suppliers_banks_init()

    const querySnapshot = await getDocs(query(billsColRef, orderBy("payment_date", 'desc')));

    return this.fromFirebaseSnapshotToViewModel(querySnapshot)
  }

  static async getBillsForYear(year: number): Promise<BillViewModelInterface[]> {
    function getYearDates(year: number) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      return { startDate, endDate };
    }

    const {startDate, endDate} = getYearDates(year)

    const billsQueries = query(billsColRef, where("payment_date", '>=', startDate), where("payment_date", "<=", endDate), orderBy("payment_date", 'desc'))

    const querySnapshot = await getDocs(billsQueries);

    return this.fromFirebaseSnapshotToViewModel(querySnapshot)
    
  }


  /**
   * Download into downloadble urls, which can put into image src
   */
  static async downloadFiles(bill: BillModelInterface): Promise<string[]> {
    console.log('Files', bill.files_ref);
    const urls = bill.files_ref.map((path) => getDownloadURL(ref(storage, path)))

    const filesUrls = await Promise.all(urls)
    console.log('downloadFiles', filesUrls);

    return filesUrls
  }

  private static toFirebase(data: BillModelInterface) {

  }

  private static fromFirebaseSnapshot(querySnapshot: QuerySnapshot<DocumentData>): BillModelInterface[] {
    let billsData: BillModelInterface[] = querySnapshot.docs.map((doc) => {
      return this.fromFirebase(doc.id, doc.data())
    });

    return billsData
  }

  private static fromFirebase(id: string, docData: any): BillModelInterface {
    let billObj: BillModelInterface = {
      id: id ?? '',
      supplier_id: docData.supplier_id ?? '',
      user_id: docData.user_id ?? '',
      outlet_id: docData.outlet_id ?? '',
      payment_date: docData.payment_date.toDate(),
      total_payment: docData.total_payment ?? 0,
      payment_status: docData.payment_status,
      payment_type: docData.payment_type,
      payment_bank_id: docData.payment_bank_id ?? '',
      files_ref: docData.files_ref as string[] ?? [],
      meta: docData.meta && {
        created_at: docData.meta.created_at.toDate(),
        updated_at: docData.meta.created_at.toDate()
      }
    }

    return billObj
  }

  /**
   * 
   */
  private static fromModelToViewModel(billModel: BillModelInterface): BillViewModelInterface {
    this.suppliers_banks_init()

    // Map Bank and Supplier
    let billViewData: BillViewModelInterface = {...billModel, supplier_name: 'Unknown supplier'}

    let foundSupplier = this.suppliers.find((s) => s.id === billViewData.supplier_id)
    billViewData = {...billViewData, supplier_name: foundSupplier ? foundSupplier.name : 'Unknown supplier'}

    if (billViewData.payment_bank_id && billViewData.payment_type === 'bank') {
      let foundBank = this.banks.find((b) => b.id === billViewData.payment_bank_id)
      billViewData = {...billViewData, payment_bank_name: foundBank ? foundBank.name : 'Unkown bank'}
    }
  
  
    return billViewData
  }

  /**
   * MAIN: Use this function to convert doc data to View Model
   */
  private static fromFirebaseToViewModel(id: string, docData: any): BillViewModelInterface {
    const model = this.fromFirebase(id, docData)
    return this.fromModelToViewModel(model)
  }

  private static fromFirebaseSnapshotToViewModel(querySnapshot: QuerySnapshot<DocumentData>): BillViewModelInterface[] {
    let billsData: BillViewModelInterface[] = querySnapshot.docs.map((doc) => {
      return this.fromFirebaseToViewModel(doc.id, doc.data())
    });

    return billsData
  }


}

/**
 * Validate bill passed from Page
 */
function validateBill(bill: BillModelInterface, requireID: boolean = false, requireSupplier: boolean = false) {
  const validId = bill.id && isStringValid(bill.id) 
  if (requireID) {
    if (!validId) throw new Error('Require Bill Id')
  }

  const validSupplier = bill.supplier_id && isStringValid(bill.supplier_id)
  if (requireSupplier) {
    if (!validSupplier) throw new Error('Require Supplier for Bill')
  }

  if (bill.payment_type === 'bank' && !isStringValid(bill.payment_bank_id)) {
    throw new Error('Unable to add bank to bill.')
  }
}