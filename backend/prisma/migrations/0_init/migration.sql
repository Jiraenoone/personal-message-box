-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_drive_connections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "google_account_id" VARCHAR(255) NOT NULL,
    "encrypted_refresh_token" TEXT NOT NULL,
    "root_folder_id" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_boxes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "public_slug" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "box_id" UUID NOT NULL,
    "sender_name" VARCHAR(100) NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_files" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "drive_connection_id" UUID NOT NULL,
    "drive_file_id" VARCHAR(255),
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "upload_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_sessions" (
    "id" UUID NOT NULL,
    "message_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "completed_files" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_connections_user_id_key" ON "google_drive_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_boxes_public_slug_key" ON "message_boxes"("public_slug");

-- CreateIndex
CREATE INDEX "message_boxes_user_id_idx" ON "message_boxes"("user_id");

-- CreateIndex
CREATE INDEX "messages_box_id_created_at_idx" ON "messages"("box_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_box_id_sender_name_idx" ON "messages"("box_id", "sender_name");

-- CreateIndex
CREATE INDEX "message_files_message_id_idx" ON "message_files"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "upload_sessions_message_id_key" ON "upload_sessions"("message_id");

-- CreateIndex
CREATE INDEX "upload_sessions_message_id_idx" ON "upload_sessions"("message_id");

-- AddForeignKey
ALTER TABLE "google_drive_connections" ADD CONSTRAINT "google_drive_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_boxes" ADD CONSTRAINT "message_boxes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "message_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_files" ADD CONSTRAINT "message_files_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_files" ADD CONSTRAINT "message_files_drive_connection_id_fkey" FOREIGN KEY ("drive_connection_id") REFERENCES "google_drive_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

