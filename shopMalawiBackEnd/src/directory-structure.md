# Backend Source Directory Structure

```
src/
├── config/
│   └── db.js
├── controllers/
│   ├── bankDetailsController.js
│   ├── categoriesController.js
│   ├── inquiriesController.js
│   ├── locationsController.js
│   ├── messagesControllers/
│   ├── orderAndPaymentController.js
│   ├── paymentsCrontroller.js
│   ├── productController.js
│   ├── searchController.js
│   ├── usersController.js
│   └── userstoreController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── corsMiddleware.js
│   ├── dbMiddleware.js
│   ├── rateLimitMiddleware.js
│   ├── staticMiddleware.js
│   ├── uploadMiddleware.js
│   ├── uploadScreenShotsMiddleware.js
│   ├── uploadUserImagesMiddleware.js
│   └── uploadUserStoreImagesMiddleware.js
├── routes/
│   ├── bankDetails.js
│   ├── categories.js
│   ├── inquiries.js
│   ├── locations.js
│   ├── messages.js
│   ├── orderAndPayment.js
│   ├── payments.js
│   ├── products.js
│   ├── search.js
│   ├── users.js
│   └── userstore.js
└── services/
    ├── DbTransactionService.js
    ├── ErrorHandlingService.js
    ├── FileUploadService.js
    ├── PaginationService.js
    ├── ParticipantVerificationService.js
    ├── QueryBuilderService.js
    └── websocketService.js
```

This directory structure shows the organization of the backend application:

- `config/`: Configuration files including database setup
- `controllers/`: Business logic for handling different features
- `middleware/`: Request processing and authentication middleware
- `routes/`: API endpoint definitions
- `services/`: Reusable services and utilities