

# **Bug  test Reports**

## **Issue 1**

**Title** : npm run start:dev  fails with error message of  'Conversion of type '{ id: number; transactions: never[]; name: string; email:string; }' to type 'User'

**Severity**:  Critical (app won't start = nothing else can be tested)

**Steps fo reporduce :** Follow the installation process under this [LINK](https://github.com/ellatech-eth/QA-Assessment)

**Expected Result**: App would start successfully  api available at http://localhost:4000

**Actual Result**:

```
src/users/users.service.ts:38:17 - error TS2352: Conversion of type '{ id: number; transactions: never[]; name: string; email: string; }' to type 'User' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ id: number; transactions: never[]; name: string; email: string; }' is missing the following properties from type 'User': createdAt, updatedAt

38           data: { ...dto, id: 0, transactions: [] } as User,
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

[5:10:45 PM] Found 1 error. Watching for file changes.
```


## **Issue 2**

**Title** : User service accept whitespace/empty string as data

**Severity**:  Medium

**Steps fo reporduce :**

1. make POST  request to  /users and PUT to /users/:id (users service)

   ```JSON
   {
     "name": "     ",
     "email":"    "
   }
   ```

**Expected Result**: Error email and  name can't be empty(400)

**Actual Result**: 

```JSON
{
  "statusCode": 201/200,
  "message": "User created/Updated successfully",
  "data": {
    "id": 8,
    "name": "     ",
    "email": "    ",
    "createdAt": "2026-07-23T12:45:01.230Z",
    "updatedAt": "2026-07-23T12:45:01.230Z"
  }
}
```


## **Issue 3**

**Title** : User service accept non email data as valied input

**Severity**:  Critical

**Steps fo reporduce :**

1. make POST  request to  /users and PUT /users/:id (users service)

   ```JSON
   {
     "name": "abc",
     "email":"abc"
   }
   ```

**Expected Result**: Error invalied email format(400)

**Actual Result**:

```JSON
{
  "statusCode": 201/200,
  "message": "User created/updated successfully",
  "data": {
    "id": 8,
    "name": "abc",
    "email": "abc",
    "createdAt": "2026-07-23T12:45:01.230Z",
    "updatedAt": "2026-07-23T12:45:01.230Z"
  }
}
```


## **Issue 4**

**Title** : User service Return the same responce while creating and  when duplicate email is found on the DB

**Severity**:  Low

**Steps fo reporduce :**

1. make POST  request to  /users (users service)

   ```JSON
   {
     "name": "Alazar",
     "email":"alazaraddis21@gmail.com"
   }
   ```
2. Make the same request using the above body twice 

**Expected Result**: Error email and  name can't be empty(400)

**Actual Result**:

```JSON
{
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": 8,
    "name": "Alazar",
  	"email":"alazaraddis21@gmail.com"
    "createdAt": "2026-07-23T12:45:01.230Z",
    "updatedAt": "2026-07-23T12:45:01.230Z"
  }
}
```


## **Issue 5**

**Title** : Product service and Transactions services  are public need authentiction 

**Severity**:  Critical 

**Steps fo reporduce :**

1. Make  http request to any of the services

**Expected Result**: authenticate users before makeing any kind of access to the resouces 

**Actual Result**: Public



## **Issue 6**

**Title** : Product service accept whitespace/empty as valied name on the payload

**Severity**:  High

**Steps fo reporduce :**

1. make POST  request to  /products and PUT request to /products/id (products service)

   ```JSON
   {
     "name": "  ",
     "price": 0,
     "quantity": 0,
     "status": "FOR_SALE"
   }
   ```

**Expected Result**: Error email and  name can't be empty(400)

**Actual Result**:

```JSON
{
  "statusCode": 201/200,
  "message": "Product created/updated  successfully",
  "data": {
    "id": 5,
    "name": "  ",
    "price": 0,
    "quantity": 0,
    "status": "FOR_SALE",
    "createdAt": "2026-07-23T13:51:43.234Z",
    "updatedAt": "2026-07-23T13:51:43.234Z"
  }
}
```


## **Issue 7**

**Title** : Product service accept negetive price as valied price on the payload

**Severity**:  Critical

**Steps fo reporduce :**

1. make POST  request to  /products (products service)

   ```JSON
   {
     "name": "product1",
     "price": -20,
     "quantity": 0,
     "status": "FOR_SALE"
   }
   ```

**Expected Result**: Error email and  name can't be empty(400)

**Actual Result**:

```JSON
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "id": 5,
    "name": "product1",
    "price": -20,
    "quantity": 0,
    "status": "FOR_SALE",
    "createdAt": "2026-07-23T13:51:43.234Z",
    "updatedAt": "2026-07-23T13:51:43.234Z"
  }
}
```


## **Issue 8**

**Title** : Product service PUT request i assigning quantity data as price 

**Severity**:  Critical

**Steps fo reporduce :**

1. make put request to  /products/:id  (products service)

   ```TypeScript
   product.price = dto.quantity ?? product.price; // inside products.service.ts line 111 wrong logice
   ```

   ```JSON
   {
     "name": "",
     "price": 10,
     "quantity": 1000,
     "status": "FOR_SALE"
   }
   ```

**Expected Result**: Assign product price instead of the quantity

**Actual Result**:

```JSON
{
  "statusCode": 200,
  "message": "Product Updated successfully",
  "data": {
    "id": 5,
    "name": "  ",
    "price": 1000,
    "quantity": 1000,
    "status": "FOR_SALE",
    "createdAt": "2026-07-23T13:51:43.234Z",
    "updatedAt": "2026-07-23T13:51:43.234Z"
  }
}
```


## **Issue 9**

**Title** : Transaction service POST request i adding the product quantity instead of decrementing 

**Severity**:  Critical

**Steps fo reporduce :**

1. make put request to  /products/:id  (products service)

   ```TypeScript
    product.quantity += dto.quantity; // inside transaction.service.ts line 61 wrong logice
   ```

   ```JSON
   {
     "userId": 1,
     "productId": 1,
     "quantity": 1
   }
   ```

**Expected Result**: Decrument the product quantity instead of incrementing 

**Actual Result**:

Initial quantity of the product  before makeing the above request

```JSON
 "product": {
        "id": 1,
        "name": "",
        "price": "100",
        "quantity": 100,
        "status": "FOR_SALE",
        "createdAt": "2026-07-23T13:35:09.526Z",
        "updatedAt": "2026-07-23T15:29:36.032Z"
      },
```


Final quantity of the product  after makeing the above request

```JSON
 "product": {
        "id": 1,
        "name": "",
        "price": "100",
        "quantity": 101,
        "status": "FOR_SALE",
        "createdAt": "2026-07-23T13:35:09.526Z",
        "updatedAt": "2026-07-23T15:29:36.032Z"
      },
```
