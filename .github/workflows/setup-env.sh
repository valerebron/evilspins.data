#!/bin/bash
set -a && source .env && set +a

changeEnvVar() {
  local var_name="$1"
  local new_value="$2"
  local env_file=".env"
  
  if grep -q "^${var_name}=" "$env_file"; then
    sed -i "s|${var_name}=.*|${var_name}=${new_value}|" "$env_file"
  else
    echo "${var_name}=${new_value}" >> "$env_file"
  fi
}


# Variables GitHub
APP_NAME_MAIN="${GITHUB_REPOSITORY##*/}"
BRANCH_NAME=$GITHUB_REF_NAME

# Configuration pour les branches non-principales
if [ "$BRANCH_NAME" != "main" ] && [ "$BRANCH_NAME" != "master" ]; then
  DOMAIN_BRANCH="$BRANCH_NAME.$DOMAIN"
  APP_NAME_BRANCH="${APP_NAME_MAIN}.${BRANCH_NAME}"
  PORT=$(bash /var/docker-web/src/cli.sh ALLOCATE_PORT)
  sed -i "s|${APP_NAME_MAIN}|$APP_NAME_BRANCH|g" docker-compose.yml

  changeEnvVar "DOMAIN" $DOMAIN_BRANCH
  changeEnvVar "PORT" $PORT
  changeEnvVar "APP_NAME" $APP_NAME_BRANCH
  changeEnvVar "APP_DIR" "/var/docker-web/apps/$APP_NAME_BRANCH"
else
  changeEnvVar "APP_NAME" $APP_NAME_MAIN
  changeEnvVar "APP_DIR" "/var/docker-web/apps/$APP_NAME_MAIN"
fi

changeEnvVar "DATABASE_PASSWORD" $CI_PASSWORD
  changeEnvVar "DATABASE_URL" "postgresql://evilspins:$CI_PASSWORD@evilspins-db:5432/evilspins"
