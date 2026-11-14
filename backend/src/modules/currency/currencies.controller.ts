import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrencyService } from './currency.service.js';
import { CreateCurrencyDto } from './dto/create-currency.dto.js';
import { UpdateCurrencyDto } from './dto/update-currency.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  @ApiOperation({ summary: 'List all supported currencies and exchange rates' })
  @ApiResponse({ status: 200, description: 'List of currencies returned' })
  async findAll() {
    return this.currencyService.getAllCurrencies();
  }

  @Post()
  @Roles(UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new supported currency (HR_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Currency registered successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (HR_VIEWER)' })
  @ApiResponse({ status: 409, description: 'Currency already exists' })
  async create(@Body() dto: CreateCurrencyDto) {
    return this.currencyService.createCurrency(dto);
  }

  @Patch(':code')
  @Roles(UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update exchange rate or metadata for a currency (HR_ADMIN only)',
  })
  @ApiResponse({ status: 200, description: 'Currency updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (HR_VIEWER)' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  async update(
    @Param('code') code: string,
    @Body() dto: UpdateCurrencyDto,
  ) {
    return this.currencyService.updateCurrency(code.toUpperCase(), dto);
  }
}
