# Tsuber Eats

The Backend of Tsuber Eats

## User Entity

- id
- createdAt
- updatedAt

- email
- password
- role(client|owner|delivery)

## Restaurant Entity

- name
- category
- address
- coverImage

## User CRUD

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

## Restaurant CRUD

- See Categories
- See Restaurants by Category (pagination)
- See Restaurants (pagination)
- See Restaurants

- Edit Restaurant
- Delete Restaurant

- Create Dish
- Edit Dish
- Delete Dish

- Orders CRUD
- Orders Subscription (Owner | Customer | Delivery)

  - Pending Orders (Owner) (s: newOrder) (t:createOrder(newOrder))
  - Order Status (Customer) (s: orderUpdate) (t:editOrder(orderUpdate))
  - Pending Pickedup Order (Delivery) (s: orderUpdate) (t:editOrder(orderUpdate))

- Payments (CRON)
